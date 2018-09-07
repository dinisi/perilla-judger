export interface IRemoteProblemDataConfig {
    remote: string;
    problemID: string;
}

export interface IRemoteProblemResult {
    submissionID: string;
    result: any;
}

export interface ICrawerResult {
    status: string;
    result: any;
}
