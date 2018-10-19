import { Plugin } from "./base";

export type IUpdateCallback = (solution: ISolution, id: string) => Promise<void>;

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

export interface IFile {
    path: string;
    type: string;
}

export interface IUnsolvedTask {
    solutionID: string;
    solutionFiles: string[];
    problemFiles: string[];
    data?: any;
}

export interface ITask {
    solutionID: string;
    solutionFiles: IFile[];
    problemFiles: IFile[];
    data?: any;
}

export interface ISolution {
    status: SolutionResult;
    score: number;
    log?: string;
}

export interface IJudgerConfig {
    cgroup: string;
    chroot: string;
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
