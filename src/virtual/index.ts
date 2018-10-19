import { readFileSync } from "fs-extra";
import { parse } from "path";
import { Plugin } from "../base";
import { IJudgerConfig, ISolution, ITask, IUpdateCallback, SolutionResult } from "../interfaces";
import { append } from "../utils";
import { IRobotMapper } from "./interfaces";
import { Robot } from "./robots/base";

export default class VirtualPlugin extends Plugin {
    protected robots: IRobotMapper = {};
    protected config: IJudgerConfig = null;
    public constructor(robots: Robot[]) {
        super();
        for (const robot of robots) {
            if (this.robots.hasOwnProperty(robot.getName())) { throw new Error("Robot name duplicated"); }
            this.robots[robot.getName()] = robot;
        }
    }
    public getChannels() { return ["virtual"]; }
    public async initialize(config: IJudgerConfig) {
        this.config = config;
        // tslint:disable-next-line:forin
        for (const robotName in this.robots) {
            await this.robots[robotName].initialize();
        }
    }
    public async judge(task: ITask, callback: IUpdateCallback) {
        const solution: ISolution = {
            status: SolutionResult.Judging,
            score: 0,
            log: `Initialized at ${new Date()}`,
        };
        try {
            if (task.solutionFiles.length !== 1) { throw new Error("Invalid submission"); }
            const file = task.solutionFiles[0];
            if (!this.robots.hasOwnProperty(task.data.origin)) { throw new Error("Invalid Origin OnlineJudge"); }
            await this.robots[task.data.origin].submit(task.data.problemID, file, (arg: ISolution) => callback(arg, task.solutionID));
        } catch (e) {
            solution.status = SolutionResult.JudgementFailed;
            solution.log = append(solution.log, e.message);
            await callback(solution, task.solutionID);
        }
    }
}
