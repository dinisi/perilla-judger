import { readFileSync } from "fs-extra";
import { parse } from "path";
import { IProblemModel, ISolutionModel, IJudgerConfig, SolutionResult } from "../interfaces";
import { Robot } from "./robots/base";
import { Plugin } from "../base";
import { IRobotMapper } from "./interfaces";
import { append } from "../utils";

export default class VirtualPlugin extends Plugin {
    protected robots: IRobotMapper = {};
    protected config: IJudgerConfig = null;
    public constructor(robots: Robot[]) {
        super();
        for (let robot of robots) {
            if (this.robots.hasOwnProperty(robot.getName())) throw new Error("Robot name duplicated");
            this.robots[robot.getName()] = robot;
        }
    }
    public getChannels() { return ["virtual"]; }
    public async initialize(config: IJudgerConfig) {
        this.config = config;
        for (const robotName in this.robots) {
            await this.robots[robotName].initialize();
        }
    }
    protected async watch(robot: Robot, solution: ISolutionModel, originID: string, time: number) {
        robot.fetch(originID).then(async (result) => {
            solution.status = result.status;
            solution.log = append(solution.log, result.log);
            await this.config.updateSolution(solution);
            if (result.continuous && time > 0) {
                setTimeout(() => this.watch(robot, solution, originID, time - 1), 5000);
            }
        });
    }
    public async judge(solution: ISolutionModel, problem: IProblemModel) {
        try {
            solution.status = SolutionResult.Judging;
            if (solution.fileIDs.length !== 1) { throw new Error("Invalid submission"); }
            const resolvedFile = await this.config.resolveFile(solution.fileIDs[0]);
            // 1MB
            if (resolvedFile.size > 1024 * 1024) { throw new Error("Solution too big"); }
            const code = readFileSync(resolvedFile.path).toString();
            let ext = parse(resolvedFile.filename).ext;
            if (!ext) { throw new Error("Invalid solution file"); }
            ext = ext.substr(1, ext.length - 1);
            if (!this.robots.hasOwnProperty(problem.data.origin)) { throw new Error("Invalid Origin OnlineJudge"); }
            const originID = await this.robots[problem.data.origin].submit(problem.data.problemID, code, ext);
            this.watch(this.robots[problem.data.origin], solution, originID, 100);
        } catch (e) {
            solution.status = SolutionResult.JudgementFailed;
            solution.log = append(solution.log, e.message);
            await this.config.updateSolution(solution);
        }
    }
}