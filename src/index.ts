import { IJudgerConfig, IProblemModel, ISolutionModel, IPluginMapper } from "./interfaces";
import { Plugin } from "./base";

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
        problem = await config.resolveProblem(solution.problemID);
        if (!plugins.hasOwnProperty(problem.data.type)) throw new Error("Invalid data type");
        await plugins[problem.data.type].judge(solution, problem);
    } catch (e) {
        if (solution) {
            solution.status = "Failed";
            solution.result.log = e.message;
            await config.updateSolution(solution);
        }
    }
}