import { readFileSync, statSync } from "fs-extra";
import { parse } from "path";
import { getFile, getFileMeta } from "../file";
import { IJudgerConfig, IProblemModel, ISolutionModel } from "../interfaces";
import { updateSolution } from "../solution";
import { Robot } from "./robots/base";
import { LYDSYRobot } from "./robots/lydsy";
import { POJRobot } from "./robots/poj";

const robots: Robot[] = [
    new POJRobot("zhangzisu_develop", "123456"),
    new LYDSYRobot("zzsdev", "123456"),
];

export const initalize = async (config: IJudgerConfig) => {
    for (const robot of robots) {
        await robot.initalize();
    }
};

const watch = (robot: Robot, solution: ISolutionModel, originID: string, time: number) => {
    robot.fetch(originID).then(async (result) => {
        solution.status = result.status;
        solution.result = result.result;
        await updateSolution(solution);
        if (result.continuous && time > 0) {
            setTimeout(() => watch(robot, solution, originID, time - 1), 5000);
        }
    });
};

export const virtual = async (config: IJudgerConfig, solution: ISolutionModel, problem: IProblemModel) => {
    try {
        solution.status = "Initialized";
        if (solution.files.length !== 1) { throw new Error("Invalid submission"); }
        const file = await getFile(solution.files[0]);
        const meta = await getFileMeta(solution.files[0]);
        // 1MB
        if (meta.size > 1024 * 1024) { throw new Error("Solution too big"); }
        const code = readFileSync(file).toString();
        let ext = parse(meta.filename).ext;
        if (!ext) { throw new Error("Invalid solution file"); }
        ext = ext.substr(1, ext.length - 1);
        let ojIndex = null;
        switch (problem.data.origin) {
            case "POJ":
                ojIndex = 0;
                break;
            case "LYDSY":
                ojIndex = 1;
                break;
        }
        if (ojIndex === null) { throw new Error("Invalid Origin OnlineJudge"); }
        const originID = await robots[ojIndex].submit(problem.data.problemID, code, ext);
        watch(robots[ojIndex], solution, originID, 100);
    } catch (e) {
        solution.status = "Failed";
        solution.result.log = e.message;
        await updateSolution(solution);
    }
};
