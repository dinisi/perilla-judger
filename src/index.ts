import { readdir, readFileSync, statSync } from "fs-extra";
import { join } from "path";
import { getFile } from "./file";
import { get, initialize, post } from "./http";
import { ITask, JudgeFunction } from "./interfaces";

const pluginDir = "plugins";
const channels = new Set<string>();

const isPlugin = (dir: string) => {
    const stat = statSync(dir);
    if (!stat.isDirectory) { return false; }
    return true;
};

readdir(pluginDir, (err, files) => {
    for (const file of files) {
        if (!isPlugin(file)) { return; }
        channels.add(file);
    }
});

const config = JSON.parse(readFileSync("config.json").toString());

initialize(config.server, config.username, config.password).then(() => {
    const channel = [...channels];
    const process = () => {
        try {
            get("/api/judge/", { channel }).then((task: ITask) => {
                const judge = require(join(pluginDir, task.channel)) as JudgeFunction;
                judge(
                    task.problem,
                    task.solution,
                    async (id) => {
                        return await getFile(task.owner, id);
                    },
                    async (solution) => {
                        return await post("/api/judger/", { objectID: task.objectID }, solution);
                    },
                ).then(() => {
                    // Continue to recive tasks
                    setTimeout(process, 0);
                });
            });
        } catch (e) {
            // Empty queue, sleep 5 sec
            setTimeout(process, 5000);
        }
    };
    setTimeout(process, 0);
});
