import { promisifyAll } from "bluebird";
import * as redis from "redis";
import { IJudgerConfig } from "./interfaces";
import { getSolution } from "./solution";

promisifyAll(redis);
const instance: any = redis.createClient();

const judge = async (config: IJudgerConfig) => {
    while (true) {
        const solutionID = (await instance.brpop("judgeTask", 0));
        const solution = await getSolution(solutionID);
        //
    }
};
