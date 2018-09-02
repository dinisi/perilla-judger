export interface IBFileModel {
    _id: string;
    hash: string;
}

export interface ISolutionModel {
    _id: string;
    problemID: string;
    files: string[];
    status: string;
    result?: any;
    meta?: any;
}

export interface IJudgerConfig {
    server: string;
    username: string;
    password: string;
}
