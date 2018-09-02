import { promisifyAll } from "bluebird";
import * as redis from "redis";
import { ICommonConfig } from "./interface/config";
promisifyAll(redis);
const instance: any = redis.createClient();

const judge = async (config: ICommonConfig) => {
    while (true) {
        const solutionID = (await instance.brpop("judgeTask", 0));
        //
    }
};
