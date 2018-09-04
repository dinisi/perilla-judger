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
    initialize(config);
    const judgeLoop = async () => {
        const solutionID = (await instance.rpop("judgeTask", 0));
        if (solutionID) {
            const solution = await getSolution(solutionID);
            const problem = await getProblem(solution.problemID);
            await choose(config, solution, problem);
        }
        setTimeout(judgeLoop, 50);
    };
};

startJudge({
    cgroup: "test",
    chroot: "/run/media/zhangzisu/Data",
    password: "vpZCyAimOE",
    server: "http://127.0.0.1",
    user: "zhangzisu",
    username: "Judger",
});
