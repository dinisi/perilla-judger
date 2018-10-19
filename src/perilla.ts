// tslint:disable:no-console
import { promisifyAll } from "bluebird";
import cluster = require("cluster");
import { emptyDirSync, ensureDirSync } from "fs-extra";
import {join} from "path";
import redis = require("redis");
import { getFile } from "./file";
import * as http from "./http";
import { IJudgerConfig } from "./interfaces";

const PERILLA_SERVER = "http://example.com";
const PERILLA_USER = "username";
const PERILLA_PASS = "password";
const CHROOT_PATH = "/path/to/chroot";

if (cluster.isMaster) {
    http.initialize(PERILLA_SERVER, PERILLA_USER, PERILLA_PASS).then(() => {
        const TMPPrefix = "tmp";
        const cpuCount = require("os").cpus().length;
        for (let i = 0; i < cpuCount; i++) {
            console.log("[MASTER] starting worker " + i);
            const TMP = join(TMPPrefix, "worker_" + i);
            ensureDirSync(TMP);
            emptyDirSync(TMP);
            const worker = cluster.fork({
                WORKER_ID: i,
                TMP_DIR: TMP,
            });
            type messageType = "log" | "file" | "solution";
            const sendMsg = (type: messageType, payload: any) => {
                worker.send(JSON.stringify({ type, payload }));
            };
            worker.on("message", (message) => {
                try {
                    const parsed = JSON.parse(message);
                    if (parsed.type === "log") {
                        console.log(`[#${i}] ${parsed.payload}`);
                    } else if (parsed.type === "file") {
                        console.log(`File request #${parsed.payload.requestID} @${i}`);
                        getFile(parsed.payload.fileID).then((file) => {
                            console.log(`File response #${parsed.payload.requestID} @${i} succeed`);
                            sendMsg("file", { file, requestID: parsed.payload.requestID });
                        }).catch((e) => {
                            console.log(`File response #${parsed.payload.requestID} @${i} failed`);
                            sendMsg("file", { file: null, requestID: parsed.payload.requestID, error: e.message });
                        });
                    } else if (parsed.type === "solution") {
                        //
                    }
                } catch (e) {
                    console.log("Failed process message: " + message);
                }
            });
        }
    });
} else {
    type messageType = "log" | "file";
    const sendMsg = (type: messageType, payload: any) => {
        process.send(JSON.stringify({ type, payload }));
    };
    const fileResolvers: any = {};
    let fileRequestCount = 0;
    const resolveFile = (fileID: string) => {
        return new Promise((resolve, reject) => {
            fileResolvers[fileRequestCount] = { resolve, reject };
            sendMsg("file", { fileID, requestID: fileRequestCount });
            fileRequestCount++;
        });
    };
    process.on("message", (message) => {
        const parsed = JSON.parse(message);
        if (parsed.type === "FileRes") {
            console.log("file response " + parsed.payload.requestID);
            if (parsed.payload.file) {
                fileResolvers[parsed.payload.requestID].resolve(parsed.payload.file);
            } else {
                fileResolvers[parsed.payload.requestID].reject(parsed.payload.error);
            }
            delete fileResolvers[parsed.payload.requestID];
        }
    });

    console.log = (message: any) => {
        sendMsg("log", message);
    };
    console.log("started");

    promisifyAll(redis);
    const instance = redis.createClient();

    const config: IJudgerConfig = {
        cgroup: "JUDGE" + process.env.WORKER_ID,  // Cgroup, for sandbox
        chroot: CHROOT_PATH,
    };

    (async () => {
        await perillaJudger.initialize(config);
        while (true) {
            const solutionID = (await instance.brpopAsync("judgeTask", 300))[1];
            if (solutionID) {
                console.log(solutionID);
                await perillaJudger.judge(solutionID);
            }
        }
    })();
}
