export interface ITestcase {
    fileIndex: number;
    extraFile: number;
}

export interface IDataConfig {
    testcases: ITestcase[];
    judgerFile: number;
}

export interface ITestcaseResult {
    status: string;
    score: number;
    extra: string;
}

export interface IResult {
    testcases?: ITestcaseResult[];
    score: number;
    judgerCompileResult?: string;
    log: string;
}
