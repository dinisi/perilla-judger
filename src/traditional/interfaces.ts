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
