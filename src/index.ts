import debug = require("debug");
import { readdirSync, statSync } from "fs";
import { join } from "path";
import { getFile } from "./file";
import { get, initialize, post } from "./http";
import { ITask, JudgeFunction, SolutionResult } from "./interfaces";

const log = debug("main");

const pluginDir = join(__dirname, "..", "plugins");
const channelSet = new Set<string>();

const isPlugin = (dir: string) => {
    const stat = statSync(dir);
    if (!stat.isDirectory) { return false; }
    return true;
};

for (const file of readdirSync(pluginDir)) {
    log("Plugin: %s", file);
    if (!isPlugin(join(pluginDir, file))) { continue; }
    channelSet.add(file);
}

if (!channelSet.size) {
    log("No plugin found");
    process.exit(0);
}

initialize();
(async () => {
    const channels = [...channelSet];
    const process = () => {
        get("/api/judger/pop", { channels })
            .then((task: ITask) => {
                log("Task received using %s", task.channel);
                const judge = require(join(pluginDir, task.channel)) as JudgeFunction;
                judge(task.problem, task.solution, async (id) => await getFile(task.owner, id), async (solution) => await post("/api/judger/", { objectID: task.objectID }, solution))
                    .then(() => {
                        // Continue to recive tasks
                        setTimeout(process, 0);
                    })
                    .catch((err) => {
                        // System Error
                        post("/api/judger/", { objectID: task.objectID }, { status: SolutionResult.SystemError, score: 0, details: { error: err.message } })
                            .then(() => { setTimeout(process, 0); });
                    });
            })
            .catch(() => {
                // Empty queue, sleep 1 sec
                setTimeout(process, 1000);
            });
    };
    setTimeout(process, 0);
})();
