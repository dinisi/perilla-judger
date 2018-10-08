const PERILLA_SERVER = "http://example.com";
const PERILLA_USER = "username";
const PERILLA_PASS = "password";
const CHROOT_PATH = "/path/to/chroot";

const cluster = require("cluster");
if (cluster.isMaster) {
    const fs = require("fs-extra");
    const path = require("path");
    const file = require("./file");
    const http = require("./http");
    http.initialize(PERILLA_SERVER, PERILLA_USER, PERILLA_PASS).then(() => {
        const TMPPrefix = "tmp";
        const cpuCount = require("os").cpus().length;
        for (let i = 0; i < cpuCount; i++) {
            console.log("[MASTER] starting worker " + i);
            const TMP = path.join(TMPPrefix, "worker_" + i);
            fs.ensureDirSync(TMP);
            fs.emptyDirSync(TMP);
            const worker = cluster.fork({
                WORKER_ID: i,
                TMP_DIR: TMP
            });
            const sendMsg = (type, payload) => {
                worker.send(JSON.stringify({ type, payload }));
            };
            worker.on("message", (message) => {
                try {
                    const parsed = JSON.parse(message);
                    if (parsed.type === "log") {
                        console.log(`[#${i}] ${parsed.payload}`);
                    } else if (parsed.type === "FileReq") {
                        console.log(`File request #${parsed.payload.requestID} @${i}`)
                        file.getFile(parsed.payload.fileID).then(file => {
                            console.log(`File response #${parsed.payload.requestID} @${i} succeed`);
                            sendMsg("FileRes", { file, requestID: parsed.payload.requestID });
                        }).catch(e => {
                            console.log(`File response #${parsed.payload.requestID} @${i} failed`);
                            sendMsg("FileRes", { file: null, requestID: parsed.payload.requestID, error: e.message });
                        });
                    }
                } catch (e) {
                    console.log("Failed process message: " + message);
                }
            });
        }
    });
} else {
    const sendMsg = (type, payload) => {
        process.send(JSON.stringify({ type, payload }));
    };
    let fileResolvers = {};
    let fileRequestCount = 0;
    const resolveFile = (fileID) => {
        return new Promise((resolve, reject) => {
            fileResolvers[fileRequestCount] = { resolve, reject };
            sendMsg("FileReq", { fileID, requestID: fileRequestCount });
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

    console.log = (message) => {
        sendMsg("log", message);
    };
    console.log("started");

    const redis = require("redis");
    const promisifyAll = require("bluebird").promisifyAll;

    promisifyAll(redis);
    const instance = redis.createClient();
    const http = require("./http");

    const solution = require("./solution");
    const problem = require("./problem");

    const config = {
        cgroup: "JUDGE" + process.env.WORKER_ID,  // Cgroup, for sandbox
        chroot: CHROOT_PATH,
        resolveSolution: solution.getSolution,
        updateSolution: solution.updateSolution,
        resolveProblem: problem.getProblem,
        resolveFile: resolveFile
    };

    (async () => {
        await http.initialize(PERILLA_SERVER, PERILLA_USER, PERILLA_PASS);

        const perillaJudger = require("./dist");
        // Register plugins
        // Direct (submit-answer) (提交答案)
        const DirectPlugin = require("./dist/direct").default;
        perillaJudger.registerPlugin(new DirectPlugin());
        // Traditional (传统题)
        const traditional = require("./dist/traditional").default;
        perillaJudger.registerPlugin(new traditional());
        // Virtual (虚拟)
        // Please notice that VirtualPlugin constructor need a list of Robots
        // see src/virtual/robots for details
        // 注意VirtualPlugin初始化需要传入一个Robot列表
        const virtual = require("./dist/virtual").default;
        const POJRobot = require("./dist/virtual/robots/poj").default;
        perillaJudger.registerPlugin(new virtual([
            // new POJRobot("zhangzisu_develop", "123456")
        ]));
        // Initialize perillaJudger
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