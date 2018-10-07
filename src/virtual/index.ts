import { readFileSync } from "fs-extra";
import { parse } from "path";
import { getFile, getFileMeta } from "../file";
import { IProblemModel, ISolutionModel } from "../interfaces";
import { updateSolution } from "../solution";
import { Robot } from "./robots/base";
import { Plugin } from "../base";
import { IRobotMapper } from "./interfaces";

export default class VirtualPlugin extends Plugin {
    protected robots: IRobotMapper = {};
    public constructor(robots: Robot[]) {
        super();
        for (let robot of robots) {
            if (this.robots.hasOwnProperty(robot.getName())) throw new Error("Robot name duplicated");
            this.robots[robot.getName()] = robot;
        }
    }
    public getType() { return "virtual"; }
    public async initialize() {
        for (const robotName in this.robots) {
            await this.robots[robotName].initialize();
        }
    }
    protected async watch(robot: Robot, solution: ISolutionModel, originID: string, time: number) {
        robot.fetch(originID).then(async (result) => {
            solution.status = result.status;
            solution.result = result.result;
            await updateSolution(solution);
            if (result.continuous && time > 0) {
                setTimeout(() => this.watch(robot, solution, originID, time - 1), 5000);
            }
        });
    }
    public async judge(solution: ISolutionModel, problem: IProblemModel) {
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
            if (!this.robots.hasOwnProperty(problem.data.origin)) { throw new Error("Invalid Origin OnlineJudge"); }
            const originID = await this.robots[problem.data.origin].submit(problem.data.problemID, code, ext);
            this.watch(this.robots[problem.data.origin], solution, originID, 100);
        } catch (e) {
            solution.status = "Failed";
            solution.result.log = e.message;
            await updateSolution(solution);
        }
    }
}