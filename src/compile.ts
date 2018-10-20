import { copyFileSync, emptyDirSync, ensureDirSync, existsSync, pathExists, readFileSync } from "fs-extra";
import { join, parse, resolve } from "path";
import * as sandbox from "simple-sandbox";
import { SandboxParameter, SandboxStatus } from "simple-sandbox/lib/interfaces";
import { IFile, ILanguageInfo } from "./interfaces";
import { ICompileResult, IJudgerConfig } from "./interfaces";
import { getLanguageInfo } from "./language";
import { shortRead } from "./shortRead";

const compileDir = resolve(join(process.env.TMP_DIR || "tmp", "compile"));

export const compile = async (config: IJudgerConfig, file: IFile): Promise<ICompileResult> => {
    try {
        const source = file.path;
        ensureDirSync(compileDir);
        emptyDirSync(compileDir);
        const info = getLanguageInfo(file);

        if (info.requireCompile) {
            copyFileSync(source, join(compileDir, info.sourceFilename));
            const compileParameter: SandboxParameter = {
                cgroup: config.cgroup,
                chroot: config.chroot,
                environments: ["PATH=/usr/lib/jvm/java-1.8-openjdk/bin:/usr/share/Modules/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"],
                executable: info.compilerPath,
                memory: 512 * 1024 * 1024,
                mountProc: true,
                mounts: [
                    {
                        dst: "/root",
                        limit: -1,
                        src: compileDir,
                    },
                ],
                parameters: info.compilerParameters,
                process: -1,
                redirectBeforeChroot: false,
                stderr: "stderr",
                stdout: "stdout",
                time: 10000,
                user: "root",
                workingDirectory: "/root",
            };
            const compileProcess = await sandbox.startSandbox(compileParameter);
            const compileResult = await compileProcess.waitForStop();
            const compileOutput = `${shortRead(join(compileDir, "stdout"))}${shortRead(join(compileDir, "stderr"))}`;
            const result: ICompileResult = {
                execFile: join(compileDir, info.compiledFilename),
                output: compileOutput,
                success: compileResult.status === SandboxStatus.OK && existsSync(join(compileDir, info.compiledFilename)),
            };
            return result;
        } else {
            copyFileSync(source, join(compileDir, info.compiledFilename));
            const result: ICompileResult = {
                execFile: join(compileDir, info.compiledFilename),
                output: "",
                success: true,
            };
            return result;
        }
    } catch (e) {
        // tslint:disable-next-line:no-console
        console.log(e.stack);
        const result: ICompileResult = {
            execFile: "",
            output: e.message,
            success: true,
        };
        return result;
    }
};
