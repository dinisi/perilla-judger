import { Plugin } from "./base";
import { IJudgerConfig, IPluginMapper, IProblemModel, ISolutionModel, SolutionResult } from "./interfaces";
import { append } from "./utils";

let config: IJudgerConfig = null;
const plugins: Plugin[] = [];
const mapper: IPluginMapper = {};
export const registerPlugin = (plugin: Plugin) => {
    plugins.push(plugin);
};

// tslint:disable-next-line:variable-name
export const initialize = async (_config: IJudgerConfig) => {
    config = _config;
    for (const plugin of plugins) {
        try {
            await plugin.initialize(config);
            const channels = plugin.getChannels();
            for (const channelName of channels) {
                mapper[channelName] = plugin;
            }
        } catch (e) {
            // tslint:disable-next-line:no-console
            console.log("Error while initializing plugin: " + e.message);
        }
    }
};

export const judge = async (solutionID: string, channel: string) => {
    let solution: ISolutionModel = null;
    let problem: IProblemModel = null;
    try {
        solution = await config.resolveSolution(solutionID);
        solution.log = "";
        problem = await config.resolveProblem(solution.problemID);
        if (!mapper[channel]) { throw new Error("Invalid data type"); }
        await mapper[channel].judge(solution, problem);
    } catch (e) {
        if (solution) {
            solution.status = SolutionResult.SystemError;
            solution.log = append(solution.log, e.message);
            await config.updateSolution(solution);
        }
    }
};

export const getChannels = () => {
    const result = [];
    // tslint:disable-next-line:forin
    for (const channel in mapper) { result.push(channel); }
    return result;
};
