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
    solution.status = "Judging";
    await updateSolution(solution);
    if (problem.data.type === "traditional") {
        await traditional(config, solution, problem);
    }
};

const startJudge = async (config: IJudgerConfig) => {
    await initialize(config);
    const judgeLoop = async () => {
        const solutionID = (await instance.rpopAsync("judgeTask"));
        if (solutionID) {
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
    password: "GkvVpuSzhb",
    server: "http://127.0.0.1:3000",
    user: "zhangzisu",
    username: "Judger",
});
