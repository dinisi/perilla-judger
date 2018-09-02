export interface ITestcase {
    inputFile: string;
    outputFile: string;
}

export interface ISubtask {
    name: string;
    score: number;
    testcases: ITestcase[];
    depends: string[];
    type: string;
    timeLimit: string;
    memoryLimit: string;
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
    testcases: ITestcaseResult[];
    status: string;
    score: number;
    time: number;
    memory: number;
}

export interface ITraditionProblemResult {
    subtasks: ISubtask[];
    status: string;
    score: number;
    time: number;
    memory: number;
}
