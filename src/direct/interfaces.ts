export interface ITestcase {
    fileIndex: number;
    extraFile: string;
}

export interface IDataConfig {
    testcases: ITestcase[];
    judgerFile: string;
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
