import debug = require("debug");
import { readdirSync, readFileSync, statSync } from "fs-extra";
import { random } from "lodash";
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

const config = JSON.parse(readFileSync("config.json").toString());

initialize(config.server, config.username, config.password).then(() => {
    const channels = [...channelSet];
    const process = () => {
        const channel = channels[random(0, channels.length - 1)];
        get("/api/judger/pop", { channel })
            .then((task: ITask) => {
                log("Task received using %s", channel);
                const judge = require(join(pluginDir, channel)) as JudgeFunction;
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
                }).catch((err) => {
                    // System Error
                    post("/api/judger/",
                        {
                            objectID: task.objectID,
                        },
                        {
                            status: SolutionResult.SystemError,
                            score: 0,
                            details: { error: err.message },
                        },
                    ).then(() => {
                        setTimeout(process, 0);
                    });
                });
            })
            .catch(() => {
                // Empty queue, sleep 1 sec
                setTimeout(process, 1000);
            });
    };
    setTimeout(process, 0);
});
