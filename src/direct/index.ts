import { copyFileSync, copySync, emptyDirSync, ensureDirSync } from "fs-extra";
import { join, parse, resolve } from "path";
import { startSandbox } from "simple-sandbox";
import { SandboxParameter } from "simple-sandbox/lib/interfaces";
import { Plugin } from "../base";
import { compile } from "../compile";
import { IJudgerConfig, ILanguageInfo, IProblemModel, ISolutionModel, SolutionResult } from "../interfaces";
import { getLanguageInfo } from "../language";
import { shortRead } from "../shortRead";
import { append } from "../utils";
import { IDataConfig } from "./interfaces";

const solutionPath = resolve(join(process.env.TMP_DIR || "tmp", "judge/direct/solution/"));
const judgerDir = resolve(join(process.env.TMP_DIR || "tmp", "judge/direct/judger/"));

export default class DirectPlugin extends Plugin {
    protected config: IJudgerConfig = null;
    public async initialize(config: IJudgerConfig) {
        this.config = config;
    }
    public getChannels() { return ["direct"]; }
    public async judge(solution: ISolutionModel, problem: IProblemModel) {
        const log = (str: string) => {
            solution.log = append(solution.log, str);
        };
        try {

            solution.status = SolutionResult.Judging;
            solution.score = 0;
            log(`Initialized at ${new Date()}`);
            ensureDirSync(solutionPath);
            emptyDirSync(solutionPath);
            ensureDirSync(judgerDir);
            emptyDirSync(judgerDir);
            await this.config.updateSolution(solution);
            const data = problem.data as IDataConfig;

            log("Compiling judger");
            if (!problem.fileIDs[data.judgerFile]) { throw new Error("Invalid data config"); }
            const resolvedJudger = await this.config.resolveFile(problem.fileIDs[data.judgerFile]);
            const judgerCompileResult = await compile(this.config, resolvedJudger);
            log(judgerCompileResult.output);
            if (!judgerCompileResult.success) { throw new Error("Judger Compile Error"); }
            const ext = parse(resolvedJudger.filename).ext;
            if (!ext) { throw new Error("Invalid judger file"); }
            const judgerLanguageInfo = getLanguageInfo(ext.substr(1, ext.length - 1)) as ILanguageInfo;
            const judgerExecFile = join(judgerDir, judgerLanguageInfo.compiledFilename);
            copySync(judgerCompileResult.execFile, judgerExecFile);

            log("Resolving testcases");
            solution.status = SolutionResult.Judging;
            const scorePerCase = 100 / data.testcases.length;
            for (const testcase of data.testcases) {
                if (!solution.fileIDs[testcase.fileIndex]) { throw new Error("Invalid solution"); }
                const user = (await this.config.resolveFile(solution.fileIDs[testcase.fileIndex])).path;
                if (!problem.fileIDs[testcase.extraFile]) { throw new Error("Invalid data config"); }
                const extra = (await this.config.resolveFile(problem.fileIDs[testcase.extraFile])).path;
                const runDir = resolve(join(process.env.TMP_DIR || "tmp", "judge/direct/exec/run"));
                ensureDirSync(runDir);
                emptyDirSync(runDir);
                copyFileSync(extra, join(runDir, "extra"));
                copyFileSync(user, join(runDir, "user"));
                copyFileSync(judgerExecFile, join(runDir, judgerLanguageInfo.compiledFilename));
                const judgerRunParameter: SandboxParameter = {
                    cgroup: this.config.cgroup,
                    chroot: this.config.chroot,
                    environments: ["PATH=/usr/lib/jvm/java-1.8-openjdk/bin:/usr/share/Modules/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"],
                    executable: judgerLanguageInfo.execPath,
                    memory: 512 * 1024 * 1024,
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
                    stdout: "stdout",
                    time: 10000,
                    user: "root",
                    workingDirectory: "/root",
                };
                const judgerProcess = await startSandbox(judgerRunParameter);
                const judgerRunResult = await judgerProcess.waitForStop();
                log("extra:");
                log(shortRead(join(runDir, "stdout")));

                const score = judgerRunResult.code === 0 ? 100 : 0;
                const status = judgerRunResult.code === 0 ? SolutionResult.Accepted : SolutionResult.WrongAnswer;
                solution.score += score * scorePerCase / 100;
                if (solution.status === SolutionResult.Judging && status !== SolutionResult.Accepted) {
                    solution.status = status;
                }
            }
            if (solution.status === SolutionResult.Judging) {
                solution.status = SolutionResult.Accepted;
            }
            log(`Done at ${new Date()}`);
            await this.config.updateSolution(solution);
        } catch (e) {
            solution.status = SolutionResult.JudgementFailed;
            log(e.message);
            await this.config.updateSolution(solution);
        }
    }
}
