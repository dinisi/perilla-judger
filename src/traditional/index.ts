import { copyFileSync, copySync, emptyDir, emptyDirSync, ensureDirSync, existsSync } from "fs-extra";
import { join, resolve } from "path";
import { startSandbox } from "simple-sandbox";
import { SandboxParameter, SandboxStatus } from "simple-sandbox/lib/interfaces";
import { compile } from "../compile";
import { getFile, getFileMeta } from "../file";
import { IJudgerConfig, ILanguageInfo, IProblemModel, ISolutionModel } from "../interfaces";
import { getLanguageInfo } from "../language";
import { shortRead } from "../shortRead";
import { updateSolution } from "../solution";
import { ISubtask, ITestcaseResult, ITraditionProblemDataConfig, ITraditionProblemResult } from "./interface";

const solutionDir = resolve("files/tmp/judge/solution/");
const judgerDir = resolve("files/tmp/judge/judger/");

export const traditional = async (config: IJudgerConfig, solution: ISolutionModel, problem: IProblemModel) => {
    const sourceFile = solution.files[0];
    const data = problem.data as ITraditionProblemDataConfig;
    solution.status = "Initialized";
    solution.result = { score: 0 };
    await updateSolution(solution);

    ensureDirSync(solutionDir);
    emptyDirSync(solutionDir);
    ensureDirSync(judgerDir);
    emptyDirSync(judgerDir);

    const judgerCompileResult = await compile(config, data.judgerFile);
    solution.result.judgerCompileResult = judgerCompileResult.output;
    if (!judgerCompileResult.success) {
        solution.status = "Judger CE";
        await updateSolution(solution);
        return;
    }
    const judgerLanguageInfo = getLanguageInfo(getFileMeta(data.judgerFile).type) as ILanguageInfo;
    const judgerExecFile = join(judgerDir, judgerLanguageInfo.compiledFilename);
    copySync(judgerCompileResult.execFile, judgerExecFile);

    const solutionCompileResult = await compile(config, sourceFile);
    solution.result.compileResult = solutionCompileResult.output;
    if (!solutionCompileResult.success) {
        solution.status = "Solution CE";
        await updateSolution(solution);
        return;
    }
    const solutionLanguageInfo = getLanguageInfo(getFileMeta(sourceFile).type) as ILanguageInfo;
    const solutionExecFile = join(solutionDir, solutionLanguageInfo.compiledFilename);
    copySync(solutionCompileResult.execFile, solutionExecFile);

    const subtasks: any = {};
    for (const subtask of data.subtasks) {
        subtasks[subtask.name] = subtask;
        subtasks[subtask.name].resolved = false;
        subtasks[subtask.name].judged = false;
    }

    // JudgeTest
    const judgeTest = async (input: string, output: string, timeLimit: number, memoryLimit: number): Promise<ITestcaseResult> => {
        input = await getFile(input);
        output = await getFile(output);

        const runDir = resolve("files/tmp/run/run");
        const tmpDir = resolve("files/tmp/run/tmp");
        ensureDirSync(runDir);
        ensureDirSync(tmpDir);
        emptyDir(runDir);
        emptyDir(tmpDir);
        const stdout = join(tmpDir, "stdout");
        const stderr = join(tmpDir, "stderr");
        const extra = join(tmpDir, "extra");

        copyFileSync(solutionExecFile, join(runDir, solutionLanguageInfo.compiledFilename));
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
            redirectBeforeChroot: true,
            stderr,
            stdin: input,
            stdout,
            time: timeLimit,
            user: config.user,
            workingDirectory: "/root",
        };

        const solutionProcess = await startSandbox(solutionRunParameter);
        const solutionRunResult = await solutionProcess.waitForStop();

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

        if (solutionRunResult.status !== SandboxStatus.OK) {
            result.status = SandboxStatus[solutionRunResult.status];
            result.extra = JSON.stringify(solutionRunResult);
            return result;
        }

        emptyDir(runDir);
        if (existsSync(stdout)) { copyFileSync(stdout, join(runDir, "stdout")); }
        if (existsSync(stderr)) { copyFileSync(stderr, join(runDir, "stderr")); }
        copyFileSync(input, join(runDir, "input"));
        copyFileSync(output, join(runDir, "output"));
        copyFileSync(await getFile(sourceFile), join(runDir, "source"));
        copyFileSync(judgerExecFile, join(runDir, solutionLanguageInfo.compiledFilename));
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
            redirectBeforeChroot: true,
            stdout: extra,
            time: timeLimit,
            user: config.user,
            workingDirectory: "/root",
        };
        const judgerProcess = await startSandbox(judgerRunParameter);
        const judgerRunResult = await judgerProcess.waitForStop();
        result.extra = shortRead(extra);
        if (judgerRunResult.status === SandboxStatus.OK && judgerRunResult.code === 0) {
            result.score = 1;
            result.status = "Accepted";
        } else {
            result.score = 0;
            result.status = "Wrong Answer";
        }
        return result;
    };

    // JudgeTask
    const judgeTask = async (name: string) => {
        const tasks = subtasks[name] as ISubtask;
        solution.result.subtasks[name] = { name, status: "Judging", score: 0, time: 0, memory: 0, testcases: [] };
        const scorePerCase = tasks.score / tasks.testcases.length;
        for (const test of tasks.testcases) {
            const result = await judgeTest(test.input, test.output, tasks.timeLimit, tasks.memoryLimit);
            solution.result.subtasks[name].testcases.push(result);
            solution.result.subtasks[name].time += result.time;
            solution.result.subtasks[name].memory += result.memory;
            solution.result.subtasks[name].score += result.score * scorePerCase;
            if (solution.status === "Judging" && !(result.status === "Accepted")) {
                solution.status = result.status;
                if (tasks.autoSkip) { break; }
            }
        }
        if (solution.status === "Judging") { solution.status = "Accepted"; }
    };

    const resolveSubtask = async (name: string) => {
        if (subtasks[name].resolved) {
            solution.status = "Data Error";
            (solution.result as ITraditionProblemResult).log = "Cyclic dependence detected";
            await updateSolution(solution);
            return;
        }
        subtasks[name].resolved = true;
        solution.result.subtasks[name] = { name };
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
        solution.result.subtasks[name] = await judgeTask(name);
    };
    solution.result.subtasks = {};
    for (const name in subtasks) {
        if (subtasks[name].judged) { continue; }
        await resolveSubtask(name);
    }
    solution.result.score = 0;
    solution.result.time = 0;
    solution.result.memory = 0;
    for (const name in subtasks) {
        if (solution.result.subtasks[name]) {
            solution.result.score = solution.result.subtasks[name].score / 100 * subtasks[name].score;
            if (solution.result.subtasks[name].time) {
                solution.result.time += solution.result.subtasks[name].time;
            }
            if (solution.result.subtasks[name].memory) {
                solution.result.memory += solution.result.subtasks[name].memory;
            }
            if (!solution.status && solution.result.subtasks[name].result !== "Accepted") {
                solution.status = solution.result.subtasks[name].result;
            }
        }
    }
    if (!solution.status) {
        solution.result.subtasks[name].result = "Accepted";
    }
    await updateSolution(solution);
};
