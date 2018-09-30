export interface ITestcase {
    input: number;
    output: number;
}

export interface ISubtask {
    name: string;
    score: number;
    testcases: ITestcase[];
    depends?: string[];
    autoSkip: boolean;
    timeLimit: number;
    memoryLimit: number;
}

export interface IDataConfig {
    subtasks: ISubtask[];
    judgerFile: number;
}

export interface ITestcaseResult {
    input: string;
    output: string;
    stdout: string;
    stderr: string;
    status: string;
    score: number;
    time: number;
    memory: number;
    extra: string;
}

export interface ISubtaskResult {
    name: string;
    testcases?: ITestcaseResult[];
    status: string;
    score: number;
    time?: number;
    memory?: number;
}

export interface IResult {
    subtasks?: ISubtaskResult[];
    score: number;
    time?: number;
    memory?: number;
    compileResult?: string;
    judgerCompileResult?: string;
    log?: string;
}
