export interface ITestcase {
    fileIndex: number;
    extraFile: number;
}

export interface IDataConfig {
    testcases: ITestcase[];
    judgerFile: number;
}
