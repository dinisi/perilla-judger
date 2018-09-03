import { copyFileSync, emptyDirSync, ensureDirSync, pathExists, readFileSync } from "fs-extra";
import { join, resolve } from "path";
import * as sandbox from "simple-sandbox";
import { SandboxParameter } from "simple-sandbox/src/interfaces";
import { getFile, getFileMeta } from "./file";
import { ICompileResult, IJudgerConfig } from "./interfaces";
import { getLanguageInfo } from "./languages";

const compileDir = resolve("files/tmp/compile");

export const compile = async (config: IJudgerConfig, fileID: string): ICompileResult => {
    const source = await getFile(fileID);
    const meta = getFileMeta(fileID);
    ensureDirSync(compileDir);
    emptyDirSync(compileDir);
    const info = getLanguageInfo(meta.type);

    if (info.requireCompile) {
        copyFileSync(source, join(compileDir, info.sourceFilename));
        const compileParameter: SandboxParameter = {
            cgroup: config.cgroup,
            chroot: config.chroot,
            executable: "/bin/gcc",
            memory: 512 * 1024 * 1024,
            mountProc: true,
            mounts: [
                {
                    dst: "/root/rw",
                    limit: -1,
                    src: compileDir,
                },
            ],
            parameters: info.parameters,
            process: -1,
            redirectBeforeChroot: false,
            stderr: "stderr",
            stdout: "stdout",
            time: 10000,
            user: config.user,
            workingDirectory: "/root/rw",
        };
        const compileProcess = await sandbox.startSandbox(compileParameter);
        const compileResult = await compileProcess.waitForStop();
    } else {
        copyFileSync(source, join(compileDir, info.execFilename));
        return {
            success: true,
            output: "",
            execFilename: ,
        };
    }
    return join(compileDir, info.execFilename);
};
