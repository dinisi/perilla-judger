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
    id: number;
    name: string;
    type: string;
    description: string;
    hash: string;
    size: number;
    created: Date;
    tags: string[];
    owner: string;
    creator: string;
}

export interface ITask {
    channel: string;
    owner: string;
    problem: object;
    solution: object;
    objectID: string;
}

export interface ISolution {
    status: SolutionResult;
    score: number;
    details?: object;
}

export type JudgeFunction = (
    problem: object,
    solution: object,
    resolveFile: (id: number) => Promise<{ path: string, info: IFileModel }>,
    callback: (solution: ISolution) => Promise<void>,
) => Promise<void>;
