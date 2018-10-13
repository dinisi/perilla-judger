import { Plugin } from "./base";

export enum SolutionResult {
    WaitingJudge,            // Wating Judge
    Judging,                 // Judging
    Skipped,                 // Skipped
    Accepted,                // Accepted
    WrongAnswer,             // Wrong Answer
    TimeLimitExceeded,       // Time Limit Exceeded
    MemoryLimitExceeded,     // Memory Limit Exceeded
    RuntimeError,            // Runtime Error
    CompileError,            // Compile Error
    PresentationError,       // Presentation Error
    JudgementFailed,         // Judgement Failed (Judge program error)
    SystemError,             // System Error     (Judge framwork & Judge plugin error)
    OtherError,              // Other Error
}

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
    problemID: string;
    fileIDs: string[];
    status: SolutionResult;
    score: number;
    log?: string;
}

export interface IProblemModel {
    fileIDs: string[];
    data: any;
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