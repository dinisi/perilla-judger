export interface IDataConfig {
    origin: string;
    problemID: string;
}

export interface IResult {
    time: string;
    memory: string;
    info: any;
}

export interface IRobotFetchResult {
    result: IResult;
    status: string;
    continuous: boolean;
}
