import * as http from "./http";
import { IJudgerConfig, IProblemModel, ISolutionModel, IPluginMapper } from "./interfaces";
import { updateSolution, getSolution } from "./solution";
import { Plugin } from "./base";
import { getProblem } from "./problem";

const plugins: IPluginMapper = {};
export const registerPlugin = (plugin: Plugin) => {
    if (plugins.hasOwnProperty(plugin.getType())) {
        throw new Error("Plugin already registered");
    }
    plugins[plugin.getType()] = plugin;
}

export const initialize = async (config: IJudgerConfig) => {
    await http.initialize(config);
    for (let pluginName in plugins) {
        await plugins[pluginName].initialize(config);
    }
};

export const judge = async (solutionID: string) => {
    let solution: ISolutionModel = null, problem: IProblemModel = null;
    try {
        solution = await getSolution(solutionID);
        problem = await getProblem(solution.problemID);
        if (!plugins.hasOwnProperty(problem.data.type)) throw new Error("Invalid data type");
        await plugins[problem.data.type].judge(solution, problem);
    } catch (e) {
        if (solution) {
            solution.status = "Failed";
            solution.result.log = e.message;
            await updateSolution(solution);
        }
    }
}