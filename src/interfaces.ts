import { Plugin } from "./base";

export interface IBFileModel {
    _id: string;
    owner: string;
    filename: string;
    description: string;
    hash: string;
    size: number;
    allowedRead: string[];
    allowedModify: string[];
    created: Date;
}

export interface ISolutionModel {
    _id: string;
    problemID: string;
    files: string[];
    status: string;
    result?: any;
    meta?: any;
}

export interface IProblemModel {
    files: string[];
    data: any;
    meta?: any;
}

export interface IJudgerConfig {
    server: string;
    username: string;
    password: string;
    cgroup: string;
    chroot: string;
}

export interface ICompileResult {
    success: boolean;
    output: string;
    execFile: string;
}

export interface ILanguageInfo {
    requireCompile: boolean;
    sourceFilename: string;
    compiledFilename: string;
    compilerPath: string;
    compilerParameters: string[];
    execPath: string;
    execParameters: string[];
    judgePath: string;
    judgeParameters: string[];
}

export interface IPluginMapper {
    [key: string]: Plugin;
}