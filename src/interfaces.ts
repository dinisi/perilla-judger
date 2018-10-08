import { Plugin } from "./base";

export interface IFileModel {
    _id: string;
    filename: string;
    description: string;
    hash: string;
    size: number;
    path: string;
    created: Date;
}

export interface ISolutionModel {
    _id: string;
    problemID: string;
    files: string[];
    status: string;
    result?: any;
    meta?: any;
}

export interface IProblemModel {
    files: string[];
    data: any;
    meta?: any;
}

export interface IJudgerConfig {
    cgroup: string;
    chroot: string;
    resolveFile(fileID: string): Promise<IFileModel>;
    resolveSolution(solutionID: string): Promise<ISolutionModel>;
    updateSolution(solution: ISolutionModel): Promise<void>;
    resolveProblem(problemID: string): Promise<IProblemModel>;
}

export interface ICompileResult {
    success: boolean;
    output: string;
    execFile: string;
}

export interface ILanguageInfo {
    requireCompile: boolean;
    sourceFilename: string;
    compiledFilename: string;
    compilerPath: string;
    compilerParameters: string[];
    execPath: string;
    execParameters: string[];
    judgePath: string;
    judgeParameters: string[];
}

export interface IPluginMapper {
    [key: string]: Plugin;
}