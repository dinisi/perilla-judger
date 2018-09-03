import { IJudgerConfig, IProblemModel, ISolutionModel } from "../interfaces";
import { ITraditionProblemDataConfig } from "./interface";

export const traditional = async (config: IJudgerConfig, solution: ISolutionModel, problem: IProblemModel) => {
    const sourceFile = solution.files[0];
    const judger = (problem.data as ITraditionProblemDataConfig).judgerFile;
    const sourceFileExec = 
};
