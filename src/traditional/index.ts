import { copyFileSync, copySync, emptyDirSync, ensureDirSync, existsSync } from "fs-extra";
import { join, parse, resolve } from "path";
import { startSandbox } from "simple-sandbox";
import { SandboxParameter, SandboxStatus } from "simple-sandbox/lib/interfaces";
import { compile } from "../compile";
import { getFile, getFileMeta } from "../file";
import { IJudgerConfig, ILanguageInfo, IProblemModel, ISolutionModel } from "../interfaces";
import { getLanguageInfo } from "../language";
import { shortRead } from "../shortRead";
import { updateSolution } from "../solution";
import { IDataConfig, IResult, ISubtask, ITestcaseResult } from "./interfaces";

const solutionDir = resolve("files/tmp/judge/traditional/solution/");
const judgerDir = resolve("files/tmp/judge/traditional/judger/");

export const traditional = async (config: IJudgerConfig, solution: ISolutionModel, problem: IProblemModel) => {
    try {
        solution.status = "Initialized";
        solution.result.score = 0;
        solution.result.log = `Initialized at ${new Date()}\n`;
        if (solution.files.length !== 1) { throw new Error("Invalid submission"); }
        const sourceFile = solution.files[0];
        const data = problem.data as IDataConfig;
        await updateSolution(solution);

        ensureDirSync(solutionDir);
        emptyDirSync(solutionDir);
        ensureDirSync(judgerDir);
        emptyDirSync(judgerDir);

        solution.result.log += "Compiling judger\n";
        if (!problem.files[data.judgerFile]) throw new Error("Invalid data config");
        const judgerCompileResult = await compile(config, problem.files[data.judgerFile]);
        solution.result.judgerCompileResult = judgerCompileResult.output;
        if (!judgerCompileResult.success) {
            solution.status = "Judger CE";
            await updateSolution(solution);
            return;
        }
        const judgerExt = parse(getFileMeta(problem.files[data.judgerFile]).filename).ext;
        if (!judgerExt) { throw new Error("Invalid judger file"); }
        const judgerLanguageInfo = getLanguageInfo(judgerExt.substr(1, judgerExt.length - 1)) as ILanguageInfo;
        const judgerExecFile = join(judgerDir, judgerLanguageInfo.compiledFilename);
        copySync(judgerCompileResult.execFile, judgerExecFile);

        solution.result.log += "Compiling solution\n";
        const solutionCompileResult = await compile(config, sourceFile);
        solution.result.compileResult = solutionCompileResult.output;
        if (!solutionCompileResult.success) {
            solution.status = "Solution CE";
            await updateSolution(solution);
            return;
        }
        const solutionExt = parse(getFileMeta(sourceFile).filename).ext;
        if (!solutionExt) { throw new Error("Invalid solution file"); }
        const solutionLanguageInfo = getLanguageInfo(solutionExt.substr(1, solutionExt.length - 1)) as ILanguageInfo;
        const solutionExecFile = join(solutionDir, solutionLanguageInfo.compiledFilename);
        copySync(solutionCompileResult.execFile, solutionExecFile);

        const subtasks: any = {};
        for (const subtask of data.subtasks) {
            subtasks[subtask.name] = subtask;
            subtasks[subtask.name].resolved = false;
            subtasks[subtask.name].judged = false;
        }

        // JudgeTest
        const judgeTest = async (inputID: number, outputID: number, timeLimit: number, memoryLimit: number): Promise<ITestcaseResult> => {
            try {
                if (!problem.files[inputID] || !problem.files[outputID]) throw new Error("Invalid data config");
                // 获取文件
                const input = await getFile(problem.files[inputID]);
                const output = await getFile(problem.files[outputID]);

                // 初始化临时文件夹
                const runDir = resolve("files/tmp/run/run");
                const tmpDir = resolve("files/tmp/run/tmp");
                ensureDirSync(runDir);
                ensureDirSync(tmpDir);
                emptyDirSync(runDir);
                emptyDirSync(tmpDir);

                // 预分配文件路径
                const stdout = join(tmpDir, "stdout");
                const stderr = join(tmpDir, "stderr");
                const extra = join(tmpDir, "extra");

                // 初始化用户程序环境
                copyFileSync(solutionExecFile, join(runDir, solutionLanguageInfo.compiledFilename));
                copyFileSync(input, join(runDir, "stdin"));
                const solutionRunParameter: SandboxParameter = {
                    cgroup: config.cgroup,
                    chroot: config.chroot,
                    environments: ["PATH=/usr/share/Modules/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"],
                    executable: solutionLanguageInfo.execPath,
                    memory: memoryLimit,
                    mountProc: true,
                    mounts: [
                        {
                            dst: "/root",
                            limit: -1,
                            src: runDir,
                        },
                    ],
                    parameters: solutionLanguageInfo.execParameters,
                    process: -1,
                    redirectBeforeChroot: false,
                    stderr: "stderr",
                    stdin: "stdin",
                    stdout: "stdout",
                    time: timeLimit,
                    user: config.user,
                    workingDirectory: "/root",
                };

                // 用户程序运行结果
                const solutionProcess = await startSandbox(solutionRunParameter);
                const solutionRunResult = await solutionProcess.waitForStop();
                copyFileSync(join(runDir, "stdout"), stdout);
                copyFileSync(join(runDir, "stderr"), stderr);

                // 初始化返回值 ITestcaseResult
                const result: ITestcaseResult = {
                    extra: "",
                    input: shortRead(input),
                    memory: solutionRunResult.memory,
                    output: shortRead(output),
                    score: 0,
                    status: "",
                    stderr: shortRead(stderr),
                    stdout: shortRead(stdout),
                    time: solutionRunResult.time,
                };

                // 用户程序非正常退出
                if (solutionRunResult.status !== SandboxStatus.OK) {
                    result.status = SandboxStatus[solutionRunResult.status];
                    result.extra = JSON.stringify(solutionRunResult);
                    return result;
                }

                // 初始化评分环境
                // 评分程序目录结构：
                // /root/execFile
                //      /userout: 用户输出流
                //      /usererr: 用户错误流
                //      /input : 标准输入
                //      /output: 标准输出
                //      /source: 用户程序
                emptyDirSync(runDir);
                copyFileSync(stdout, join(runDir, "userout"));
                copyFileSync(stderr, join(runDir, "usererr"));
                copyFileSync(input, join(runDir, "input"));
                copyFileSync(output, join(runDir, "output"));
                copyFileSync(await getFile(sourceFile), join(runDir, "source"));
                copyFileSync(judgerExecFile, join(runDir, judgerLanguageInfo.compiledFilename));
                const judgerRunParameter: SandboxParameter = {
                    cgroup: config.cgroup,
                    chroot: config.chroot,
                    environments: ["PATH=/usr/share/Modules/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"],
                    executable: judgerLanguageInfo.execPath,
                    memory: memoryLimit,
                    mountProc: true,
                    mounts: [
                        {
                            dst: "/root",
                            limit: -1,
                            src: runDir,
                        },
                    ],
                    parameters: judgerLanguageInfo.execParameters,
                    process: -1,
                    redirectBeforeChroot: false,
                    stdout: "extra",
                    time: timeLimit,
                    user: config.user,
                    workingDirectory: "/root",
                };

                // 获得评测结果 正常退出=1 非正常退出=0
                const judgerProcess = await startSandbox(judgerRunParameter);
                const judgerRunResult = await judgerProcess.waitForStop();
                copyFileSync(join(runDir, "extra"), extra);

                result.extra = shortRead(extra);
                if (judgerRunResult.status === SandboxStatus.OK && judgerRunResult.code === 0) {
                    result.score = 1;
                    result.status = "Accepted";
                } else {
                    result.score = 0;
                    result.status = "Wrong Answer";
                }
                return result;
            } catch (e) {
                return {
                    extra: e.message,
                    input: "",
                    memory: 0,
                    output: "",
                    score: 0,
                    status: "Error",
                    stderr: "",
                    stdout: "",
                    time: 0,
                };
            }
        };

        // JudgeTask
        const judgeTask = async (name: string) => {
            try {
                const tasks = subtasks[name] as ISubtask;
                solution.result.subtasks[name] = { status: "Judging", score: 0, time: 0, memory: 0, testcases: [] };
                const scorePerCase = tasks.score / tasks.testcases.length;
                for (const test of tasks.testcases) {
                    const result = await judgeTest(test.input, test.output, tasks.timeLimit, tasks.memoryLimit);
                    solution.result.subtasks[name].testcases.push(result);
                    solution.result.subtasks[name].time += result.time;
                    solution.result.subtasks[name].memory += result.memory;
                    solution.result.subtasks[name].score += result.score * scorePerCase;
                    if (solution.result.subtasks[name].status === "Judging" && !(result.status === "Accepted")) {
                        solution.result.subtasks[name].status = result.status;
                        if (tasks.autoSkip) { break; }
                    }
                }
                if (solution.result.subtasks[name].status === "Judging") { solution.result.subtasks[name].status = "Accepted"; }
            } catch (e) {
                solution.result.subtasks[name].status = "Failed";
                solution.result.subtasks[name].score = 0;
            }
        };

        const resolveSubtask = async (name: string) => {
            try {
                if (subtasks[name].resolved) {
                    solution.status = "Data Error";
                    (solution.result as IResult).log = "Cyclic dependence detected";
                    await updateSolution(solution);
                    return;
                }
                subtasks[name].resolved = true;
                solution.result.subtasks[name] = {};
                if (subtasks[name].depends && subtasks[name].depends instanceof Array) {
                    for (const dep of subtasks[name].depends) {
                        await resolveSubtask(dep);
                        if (solution.result.subtasks[dep].status !== "Accepted") {
                            solution.result.subtasks[name].status = "Skipped";
                            solution.result.subtasks[name].score = 0;
                            return;
                        }
                    }
                }
                await judgeTask(name);
                if (solution.status === "Judging" && !(solution.result.subtasks[name].status === "Accepted")) {
                    solution.status = solution.result.subtasks[name].status;
                }
                await updateSolution(solution);
            } catch (e) {
                solution.status = "Failed";
            }
        };

        solution.result.subtasks = {};
        solution.status = "Judging";
        await updateSolution(solution);

        solution.result.log += "Resolving subtasks\n";
        for (const name in subtasks) {
            if (subtasks[name].judged) { continue; }
            await resolveSubtask(name);
        }
        solution.result.score = 0;
        solution.result.time = 0;
        solution.result.memory = 0;
        for (const name in subtasks) {
            if (solution.result.subtasks[name]) {
                solution.result.score += solution.result.subtasks[name].score;
                if (solution.result.subtasks[name].time) {
                    solution.result.time += solution.result.subtasks[name].time;
                }
                if (solution.result.subtasks[name].memory) {
                    solution.result.memory += solution.result.subtasks[name].memory;
                }
                if (solution.status === "Judging" && solution.result.subtasks[name].status !== "Accepted") {
                    solution.status = solution.result.subtasks[name].status;
                }
            }
        }
        if (solution.status === "Judging") {
            solution.status = "Accepted";
        }
        solution.result.log += `Done at ${new Date()}`;
        await updateSolution(solution);
    } catch (e) {
        solution.status = "Failed";
        solution.result.log += e.message;
        await updateSolution(solution);
    }
};
