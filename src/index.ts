import { IJudgerConfig, IProblemModel, ISolutionModel, IPluginMapper, SolutionResult } from "./interfaces";
import { Plugin } from "./base";
import { append } from "./utils";

const plugins: IPluginMapper = {};
let config: IJudgerConfig = null;
export const registerPlugin = (plugin: Plugin) => {
    if (plugins.hasOwnProperty(plugin.getType())) {
        throw new Error("Plugin already registered");
    }
    plugins[plugin.getType()] = plugin;
}

export const initialize = async (_config: IJudgerConfig) => {
    config = _config;
    for (let pluginName in plugins) {
        await plugins[pluginName].initialize(config);
    }
};

export const judge = async (solutionID: string) => {
    let solution: ISolutionModel = null, problem: IProblemModel = null;
    try {
        solution = await config.resolveSolution(solutionID);
        solution.log = "";
        problem = await config.resolveProblem(solution.problemID);
        if (!plugins.hasOwnProperty(problem.data.type)) throw new Error("Invalid data type");
        await plugins[problem.data.type].judge(solution, problem);
    } catch (e) {
        if (solution) {
            solution.status = SolutionResult.SystemError;
            solution.log = append(solution.log, e.message);
            await config.updateSolution(solution);
        }
    }
}