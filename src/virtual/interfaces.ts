import { Robot } from "./robots/base";

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

export interface IRobotMapper{
    [key: string]: Robot;
}