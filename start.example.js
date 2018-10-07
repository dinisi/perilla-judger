const redis = require("redis");
const promisifyAll = require("bluebird").promisifyAll;

promisifyAll(redis);
const instance = redis.createClient();

const config = {
    cgroup: "test",                    // Cgroup, for sandbox
    chroot: "/path/to/rootfs",         // Your RootFS path
    server: "your server",             // Your perilla server
    username: "your username",         // Your perilla username
    password: "your password",         // Your perilla password
};

(async () => {
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
        new POJRobot("zhangzisu_develop", "123456")
    ]));
    // Initialize perillaJudger
    await perillaJudger.initialize(config);
    while (true) {
        const solutionID = (await instance.brpopAsync("judgeTask", 300));
        if (solutionID) {
            await perillaJudger.judge(solutionID);
        }
    }
})();