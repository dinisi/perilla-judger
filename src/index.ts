import { IJudgerConfig, IProblemModel, ISolutionModel, IPluginMapper, SolutionResult } from "./interfaces";
import { Plugin } from "./base";
import { append } from "./utils";

const plugins: IPluginMapper = {};
let config: IJudgerConfig = null;
export const registerPlugin = (plugin: Plugin) => {
    let channels = plugin.getChannels();
    for (let channel in channels) {
        if (plugins.hasOwnProperty(channel)) {
            throw new Error("Plugin already registered");
        }
        plugins[channel] = plugin;
    }
}

export const initialize = async (_config: IJudgerConfig) => {
    config = _config;
    for (let pluginName in plugins) {
        await plugins[pluginName].initialize(config);
    }
};

export const judge = async (solutionID: string, channel: string) => {
    let solution: ISolutionModel = null, problem: IProblemModel = null;
    try {
        solution = await config.resolveSolution(solutionID);
        solution.log = "";
        problem = await config.resolveProblem(solution.problemID);
        if (!plugins.hasOwnProperty(channel)) throw new Error("Invalid data type");
        await plugins[channel].judge(solution, problem);
    } catch (e) {
        if (solution) {
            solution.status = SolutionResult.SystemError;
            solution.log = append(solution.log, e.message);
            await config.updateSolution(solution);
        }
    }
}