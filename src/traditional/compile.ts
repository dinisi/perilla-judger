import { emptyDirSync, ensureDirSync } from "fs-extra";
import { resolve } from "path";
import * as sandbox from "simple-sandbox";
import { SandboxParameter } from "simple-sandbox/src/interfaces";
import { getFile, getFileMeta } from "../file";
import { IJudgerConfig } from "../interfaces";

const compileDir = resolve("files/tmp/compile");

export const compile = async (config: IJudgerConfig, fileID: string) => {
    const source = getFile(fileID);
    const meta = getFileMeta(fileID);
    ensureDirSync("files/tmp/compile");
    emptyDirSync("files/tmp/compile");
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
    //
};
