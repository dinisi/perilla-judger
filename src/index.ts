import { promisifyAll } from "bluebird";
import * as redis from "redis";
import { initialize } from "./http";
import { IJudgerConfig, IProblemModel, ISolutionModel } from "./interfaces";
import { getProblem } from "./problem";
import { getSolution, updateSolution } from "./solution";
import { traditional } from "./traditional";

promisifyAll(redis);
const instance: any = redis.createClient();

const choose = async (config: IJudgerConfig, solution: ISolutionModel, problem: IProblemModel) => {
    solution.status = "Processing";
    if (problem.data.type === "traditional") {
        solution.result = { type: "traditional" };
        await updateSolution(solution);
        await traditional(config, solution, problem);
    }
};

const startJudge = async (config: IJudgerConfig) => {
    await initialize(config);
    const judgeLoop = async () => {
        const solutionID = (await instance.rpopAsync("judgeTask"));
        if (solutionID) {
            // tslint:disable-next-line:no-console
            console.log(`Attached solutionID: ${solutionID}`);
            const solution = await getSolution(solutionID);
            const problem = await getProblem(solution.problemID);
            await choose(config, solution, problem);
        }
        setTimeout(judgeLoop, 50);
    };
    judgeLoop();
};

startJudge({
    cgroup: "test",
    chroot: "/run/media/zhangzisu/Data/RootFS",
    password: "123456",
    server: "http://127.0.0.1:3000",
    user: "root",
    username: "Judger2",
});

// startJudge({
//     cgroup: "test",
//     chroot: "/home/zhangzisu/RootFS",
//     password: "37SYojsZ3z",
//     server: "http://127.0.0.1:3000",
//     user: "root",
//     username: "Judger",
// });
