import { Plugin } from "./base";
import { IJudgerConfig, IPluginMapper, ITask, IUpdateCallback } from "./interfaces";

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

export const judge = async (task: ITask, channel: string, callback: IUpdateCallback) => {
    try {
        if (!mapper[channel]) { throw new Error("Invalid data type"); }
        await mapper[channel].judge(task, callback);
    } catch (e) {
        // tslint:disable-next-line:no-console
        console.log(e);
    }
};

export const getChannels = () => {
    const result = [];
    // tslint:disable-next-line:forin
    for (const channel in mapper) { result.push(channel); }
    return result;
};
