import { IJudgerConfig, ISolution, ITask, IUpdateCallback } from "./interfaces";

export abstract class Plugin {
    public abstract getChannels(): string[];
    public abstract initialize(config: IJudgerConfig): Promise<void>;
    public abstract judge(task: ITask, callback: IUpdateCallback): Promise<void>;
}
