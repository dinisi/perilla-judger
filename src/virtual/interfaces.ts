import { Robot } from "./robots/base";
import { SolutionResult } from "../interfaces";

export interface IDataConfig {
    origin: string;
    problemID: string;
}

export interface IRobotFetchResult {
    log: string;
    status: SolutionResult;
    continuous: boolean;
}

export interface IRobotMapper {
    [key: string]: Robot;
}

export interface IStatusMapper {
    [key: string]: SolutionResult
}