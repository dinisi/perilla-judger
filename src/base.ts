import { IJudgerConfig, ISolutionModel, IProblemModel } from "./interfaces";

export abstract class Plugin {
    public abstract getType(): string;
    public abstract initialize(config: IJudgerConfig): Promise<void>;
    public abstract judge(solution: ISolutionModel, problem: IProblemModel): Promise<void>;
}