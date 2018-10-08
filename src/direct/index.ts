import { copyFileSync, copySync, emptyDirSync, ensureDirSync } from "fs-extra";
import { join, parse, resolve } from "path";
import { startSandbox } from "simple-sandbox";
import { SandboxParameter } from "simple-sandbox/lib/interfaces";
import { compile } from "../compile";
import { IJudgerConfig, ILanguageInfo, IProblemModel, ISolutionModel } from "../interfaces";
import { getLanguageInfo } from "../language";
import { shortRead } from "../shortRead";
import { IDataConfig, ITestcaseResult } from "./interfaces";
import { Plugin } from "../base";

const solutionPath = resolve(join(process.env.TMP_DIR || "tmp", "judge/direct/solution/"));
const judgerDir = resolve(join(process.env.TMP_DIR || "tmp", "judge/direct/judger/"));

export default class DirectPlugin extends Plugin {
    protected config: IJudgerConfig = null;
    public async initialize(config: IJudgerConfig) {
        this.config = config;
    }
    public getType() { return "direct"; }
    public async judge(solution: ISolutionModel, problem: IProblemModel) {
        try {
            solution.status = "Initialized";
            solution.result.score = 0;
            solution.result.log = `Initialized at ${new Date()}\n`;
            ensureDirSync(solutionPath);
            emptyDirSync(solutionPath);
            ensureDirSync(judgerDir);
            emptyDirSync(judgerDir);
            await this.config.updateSolution(solution);
            const data = problem.data as IDataConfig;

            solution.result.log += "Compiling judger\n";
            if (!problem.files[data.judgerFile]) throw new Error("Invalid data config");
            const resolvedJudger = await this.config.resolveFile(problem.files[data.judgerFile]);
            const judgerCompileResult = await compile(this.config, resolvedJudger);
            solution.result.judgerCompileResult = judgerCompileResult.output;
            if (!judgerCompileResult.success) {
                solution.status = "Judger CE";
                await this.config.updateSolution(solution);
                return;
            }
            const ext = parse(resolvedJudger.filename).ext;
            if (!ext) { throw new Error("Invalid judger file"); }
            const judgerLanguageInfo = getLanguageInfo(ext.substr(1, ext.length - 1)) as ILanguageInfo;
            const judgerExecFile = join(judgerDir, judgerLanguageInfo.compiledFilename);
            copySync(judgerCompileResult.execFile, judgerExecFile);

            solution.result.log += "Resolving testcases\n";
            solution.result.testcases = [];
            solution.result.status = "Judging";
            for (const testcase of data.testcases) {
                if (!solution.files[testcase.fileIndex]) { throw new Error("Invalid solution"); }
                const user = (await this.config.resolveFile(solution.files[testcase.fileIndex])).path;
                if (!problem.files[testcase.extraFile]) throw new Error("Invalid data config");
                const extra = (await this.config.resolveFile(problem.files[testcase.extraFile])).path;
                const runDir = resolve("files/tmp/run/run");
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
                const result: ITestcaseResult = {
                    extra: shortRead(join(runDir, "stdout")),
                    score: judgerRunResult.code === 0 ? 1 : 0,
                    status: judgerRunResult.code === 0 ? "Accepted" : "Wrong Answer",
                };
                solution.result.testcases.push(result);
                solution.result.score += result.score;
                if (solution.result.status === "Judging" && !(result.status === "Accepted")) {
                    solution.result.status = result.status;
                }
            }
            if (solution.result.status === "Judging") {
                solution.result.status = "Accepted";
            }
            solution.result.log += `Done at ${new Date()}`;
            await this.config.updateSolution(solution);
        } catch (e) {
            solution.status = "Failed";
            solution.result.log += e.message;
            await this.config.updateSolution(solution);
        }
    }
}