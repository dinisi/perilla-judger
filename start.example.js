const redis = require("redis");
const promisifyAll = require("bluebird").promisifyAll;

promisifyAll(redis);
const instance = redis.createClient();
const http = require("./http");

const file = require("./file");
const solution = require("./solution");
const problem = require("./problem");

const config = {
    cgroup: "cgroup",                  // Cgroup, for sandbox
    chroot: "/path/to/RootFS",         // Your RootFS path
    resolveSolution: solution.getSolution,
    updateSolution: solution.updateSolution,
    resolveProblem: problem.getProblem,
    resolveFile: file.getFile
};
const REDIS_PERFIX = "PERILLA";

(async () => {
    await http.initialize("https://perilla.example.com", "username", "password");

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
    // const virtual = require("./dist/virtual").default;
    // const POJRobot = require("./dist/virtual/robots/poj").default;
    // perillaJudger.registerPlugin(new virtual([
    //     new POJRobot("zhangzisu_develop", "123456")
    // ]));
    // Initialize perillaJudger
    await perillaJudger.initialize(config);
    const channels = perillaJudger.getChannels();
    for (let index = 0; ; index = (index + 1) % channels.length) {
        const channel = channels[index];
        const solutionID = (await instance.brpopAsync(`${REDIS_PERFIX}_JQ_${channel}`, 300))[1];
        if (solutionID) {
            await perillaJudger.judge(solutionID, channel);
        }
    }
})();