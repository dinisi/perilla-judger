import { copyFileSync, copySync, emptyDirSync, ensureDirSync, existsSync } from "fs-extra";
import { join, parse, resolve } from "path";
import { startSandbox } from "simple-sandbox";
import { SandboxParameter, SandboxStatus } from "simple-sandbox/lib/interfaces";
import { compile } from "../compile";
import { IJudgerConfig, ILanguageInfo, IProblemModel, ISolutionModel, SolutionResult } from "../interfaces";
import { getLanguageInfo } from "../language";
import { shortRead } from "../shortRead";
import { IDataConfig, ISubtask } from "./interfaces";
import { Plugin } from "../base";
import { append, convertStatus } from "../utils";

const solutionDir = resolve(join(process.env.TMP_DIR || "tmp", "judge/traditional/solution/"));
const judgerDir = resolve(join(process.env.TMP_DIR || "tmp", "judge/traditional/judger/"));

export default class TraditionalPlugin extends Plugin {
    protected config: IJudgerConfig = null;
    public async initialize(config: IJudgerConfig): Promise<void> {
        this.config = config;
    }
    public getChannels() { return ["traditional"]; }
    public async judge(solution: ISolutionModel, problem: IProblemModel): Promise<void> {
        try {
            solution.status = SolutionResult.Judging;
            solution.score = 0;
            solution.log = append(solution.log, `Initialized at ${new Date()}`);
            if (solution.fileIDs.length !== 1) { throw new Error("Invalid submission"); }
            const sourceFile = solution.fileIDs[0];
            const data = problem.data as IDataConfig;
            await this.config.updateSolution(solution);

            ensureDirSync(solutionDir);
            emptyDirSync(solutionDir);
            ensureDirSync(judgerDir);
            emptyDirSync(judgerDir);

            solution.log = append(solution.log, "Compiling judger...");
            if (!problem.fileIDs[data.judgerFile]) throw new Error("Invalid data config");
            const resolvedJudger = await this.config.resolveFile(problem.fileIDs[data.judgerFile]);
            const judgerCompileResult = await compile(this.config, resolvedJudger);
            solution.log = append(solution.log, judgerCompileResult.output);
            if (!judgerCompileResult.success) throw new Error("Judger Compile Error");
            const judgerExt = parse(resolvedJudger.filename).ext;
            if (!judgerExt) { throw new Error("Invalid judger file"); }
            const judgerLanguageInfo = getLanguageInfo(judgerExt.substr(1, judgerExt.length - 1)) as ILanguageInfo;
            const judgerExecFile = join(judgerDir, judgerLanguageInfo.compiledFilename);
            copySync(judgerCompileResult.execFile, judgerExecFile);
            solution.log = append(solution.log, "Compiling solution...");
            const resolvedSolution = await this.config.resolveFile(sourceFile);
            const solutionCompileResult = await compile(this.config, resolvedSolution);
            solution.log = append(solution.log, solutionCompileResult.output);
            if (!solutionCompileResult.success) {
                solution.status = SolutionResult.CompileError;
                await this.config.updateSolution(solution);
                return;
            }
            const solutionExt = parse(resolvedSolution.filename).ext;
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
            const judgeTest = async (inputID: number, outputID: number, timeLimit: number, memoryLimit: number) => {
                solution.log = append(solution.log, `// Judging [${inputID}-${outputID}]`);
                let status = SolutionResult.Judging;
                let score = 0;
                let time = 0;
                let memory = 0;
                try {
                    if (!problem.fileIDs[inputID] || !problem.fileIDs[outputID]) throw new Error("Invalid data config");
                    // 获取文件
                    const input = (await this.config.resolveFile(problem.fileIDs[inputID])).path;
                    const output = (await this.config.resolveFile(problem.fileIDs[outputID])).path;
                    solution.log = append(solution.log, "input:");
                    solution.log = append(solution.log, shortRead(input));
                    solution.log = append(solution.log, "output:");
                    solution.log = append(solution.log, shortRead(output));

                    // 初始化临时文件夹
                    const runDir = resolve(join(process.env.TMP_DIR || "tmp", "judge/traditional/exec/run"));
                    const tmpDir = resolve(join(process.env.TMP_DIR || "tmp", "judge/traditional/exec/tmp"));
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
                        cgroup: this.config.cgroup,
                        chroot: this.config.chroot,
                        environments: ["PATH=/usr/lib/jvm/java-1.8-openjdk/bin:/usr/share/Modules/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"],
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
                        user: "root",
                        workingDirectory: "/root",
                    };

                    // 用户程序运行结果
                    const solutionProcess = await startSandbox(solutionRunParameter);
                    const solutionRunResult = await solutionProcess.waitForStop();
                    copyFileSync(join(runDir, "stdout"), stdout);
                    copyFileSync(join(runDir, "stderr"), stderr);

                    // 初始化返回值 ITestcaseResult
                    time = solutionRunResult.time;
                    memory = solutionRunResult.memory;

                    solution.log = append(solution.log, "stdout:");
                    solution.log = append(solution.log, shortRead(stdout));
                    solution.log = append(solution.log, "stderr:");
                    solution.log = append(solution.log, shortRead(stderr));
                    solution.log = append(solution.log, "Run result:");
                    solution.log = append(solution.log, `${time} ms ${memory} KB ${SandboxStatus[solutionRunResult.status]}`);

                    if (solutionRunResult.status !== SandboxStatus.OK) {
                        status = convertStatus(solutionRunResult.status);
                    } else {
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
                        copyFileSync(resolvedSolution.path, join(runDir, "source"));
                        copyFileSync(judgerExecFile, join(runDir, judgerLanguageInfo.compiledFilename));
                        const judgerRunParameter: SandboxParameter = {
                            cgroup: this.config.cgroup,
                            chroot: this.config.chroot,
                            environments: ["PATH=/usr/lib/jvm/java-1.8-openjdk/bin:/usr/share/Modules/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"],
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
                            user: "root",
                            workingDirectory: "/root",
                        };

                        // 获得评测结果 正常退出=1 非正常退出=0
                        const judgerProcess = await startSandbox(judgerRunParameter);
                        const judgerRunResult = await judgerProcess.waitForStop();
                        copyFileSync(join(runDir, "extra"), extra);

                        solution.log = append(solution.log, "extra:");
                        solution.log = append(solution.log, shortRead(extra));

                        if (judgerRunResult.status === SandboxStatus.OK && judgerRunResult.code === 0) {
                            score = 100;
                            status = SolutionResult.Accepted;
                        } else {
                            score = 0;
                            status = SolutionResult.WrongAnswer;
                        }
                    }
                } catch (e) {
                    status = SolutionResult.JudgementFailed;
                    solution.log = append(solution.log, e.message);
                }
                return { status, score, time, memory };
            };

            // JudgeTask
            const judgeTask = async (name: string) => {
                solution.log = append(solution.log, `// Judging subtask ${name}`);
                const tasks = subtasks[name] as ISubtask;
                let status = SolutionResult.Judging;
                let score = 0;
                let time = 0;
                let memory = 0;
                try {
                    const scorePerCase = 100 / tasks.testcases.length;
                    for (const i in tasks.testcases) {
                        const test = tasks.testcases[i];
                        solution.log = append(solution.log, "Judging task")
                        const result = await judgeTest(test.input, test.output, tasks.timeLimit, tasks.memoryLimit);
                        time += result.time;
                        memory = Math.max(memory, result.memory);
                        score += result.score * scorePerCase / 100;
                        if (status === SolutionResult.Judging && !(result.status === SolutionResult.Accepted)) {
                            status = result.status;
                            if (tasks.autoSkip) { break; }
                        }
                    }
                    if (status === SolutionResult.Judging) { status = SolutionResult.Accepted; }
                } catch (e) {
                    status = SolutionResult.JudgementFailed;
                }
                return { status, score, time, memory };
            };

            let result: any = {};
            let time = 0;
            let memory = 0;
            const resolveSubtask = async (name: string) => {
                if (subtasks[name].resolved) {
                    throw new Error("Cyclic dependence detected");
                }
                subtasks[name].resolved = true;
                result.subtasks[name] = {};
                let self = {
                    status: SolutionResult.Judging,
                    time: 0,
                    memory: 0,
                    score: 0,
                };
                if (subtasks[name].depends && subtasks[name].depends instanceof Array) {
                    for (const dep of subtasks[name].depends) {
                        await resolveSubtask(dep);
                        if (result.subtasks[dep].status !== SolutionResult.Accepted) {
                            self.status = SolutionResult.Skipped;
                            break;
                        }
                    }
                }
                if (self.status === SolutionResult.Judging) {
                    self = await judgeTask(name);
                }
                result[name] = self;
                solution.score += self.score * subtasks[name].score / 100;
                time += self.time;
                memory = Math.max(memory, self.memory);
                if (solution.status === SolutionResult.Judging && self.status !== SolutionResult.Accepted) {
                    solution.status = self.status;
                }
                await this.config.updateSolution(solution);
            };

            solution.status = SolutionResult.Judging;
            await this.config.updateSolution(solution);

            solution.log = append(solution.log, "Resolving subtasks");
            for (const name in subtasks) {
                if (subtasks[name].judged) { continue; }
                await resolveSubtask(name);
            }
            if (solution.status === SolutionResult.Judging) {
                solution.status = SolutionResult.Accepted;
            }
            solution.log = append(solution.log, `Total: ${time} MS ${memory} KB`);
            solution.log = append(solution.log, `Done at ${new Date()}`);
            await this.config.updateSolution(solution);
        } catch (e) {
            solution.status = SolutionResult.JudgementFailed;
            solution.log = append(solution.log, e.message);
            await this.config.updateSolution(solution);
        }
    }
};