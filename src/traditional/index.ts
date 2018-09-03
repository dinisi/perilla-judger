import { compile } from "../compile";
import { IJudgerConfig, IProblemModel, ISolutionModel } from "../interfaces";
import { updateSolution } from "../solution";
import { ITraditionProblemDataConfig, ITraditionProblemResult } from "./interface";

export const traditional = async (config: IJudgerConfig, solution: ISolutionModel, problem: IProblemModel) => {
    const sourceFile = solution.files[0];
    const data = problem.data as ITraditionProblemDataConfig;
    solution.status = "Initialized";
    solution.result = { score: 0 };
    await updateSolution(solution);

    const judgerResult = await compile(config, data.judgerFile);
    if (!judgerResult.success) {
        solution.status = "Judger CE";
        return;
    }
    const solutionResult = await compile(config, sourceFile);
    if (!solutionResult.success) {
        solution.status = "Solution CE";
        return;
    }

    const subtasks: any = {};
    for (const subtask of data.subtasks) {
        subtasks[subtask.name] = subtask;
        subtasks[subtask.name].resolved = false;
        subtasks[subtask.name].judged = false;
    }
    const judgeTask = async (name: string) => {
        //
    };
    const resolveSubtask = async (name: string) => {
        if (subtasks[name].resolved) {
            solution.status = "Data Error";
            (solution.result as ITraditionProblemResult).log = "Cyclic dependence detected";
            await updateSolution(solution);
            return;
        }
        subtasks[name].resolved = true;
        solution.result.subtasks[name] = { name };
        for (const dep of subtasks[name].depends) {
            await resolveSubtask(dep);
            if (solution.result.subtasks[dep].status !== "Accepted") {
                solution.result.subtasks[name].status = "Skipped";
                solution.result.subtasks[name].score = 0;
                return;
            }
        }
        solution.result.subtasks[name] = await judgeTask(name);
    };
    solution.result.subtasks = {};
    for (const name in subtasks) {
        if (subtasks[name].judged) { continue; }
        await resolveSubtask(name);
    }
    solution.result.score = 0;
    solution.result.time = 0;
    solution.result.memory = 0;
    for (const name in subtasks) {
        if (solution.result.subtasks[name]) {
            solution.result.score = solution.result.subtasks[name].score / 100 * subtasks[name].score;
            if (solution.result.subtasks[name].time) {
                solution.result.time += solution.result.subtasks[name].time;
            }
            if (solution.result.subtasks[name].memory) {
                solution.result.memory += solution.result.subtasks[name].memory;
            }
            if (!solution.status && solution.result.subtasks[name].result !== "Accepted") {
                solution.status = solution.result.subtasks[name].result;
            }
        }
    }
    if (!solution.status) {
        solution.result.subtasks[name].result = "Accepted";
    }
    await updateSolution(solution);
};
