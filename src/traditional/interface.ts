export interface ITestcase {
    input: string;
    output: string;
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

export interface ITraditionProblemDataConfig {
    subtasks: ISubtask[];
    judgerFile: string;
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

export interface ITraditionProblemResult {
    subtasks?: any;
    score: number;
    time?: number;
    memory?: number;
    compileResult?: string;
    judgerCompileResult?: string;
    log?: string;
}

export interface ILanguageInfo {
    requireCompile: boolean;
    sourceFilename: string;
    execFilename: string;
    compilerPath: string;
    compilerParameters: string[];
    execPath: string;
    execParameters: string[];
    judgePath: string;
    judgeParameters: string[];
}
