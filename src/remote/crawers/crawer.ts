import { ICrawerResult } from "../interfaces";

export abstract class Crawer {
    public abstract initialize(): Promise<void>;
    public abstract submitProblem(problemID: string): Promise<string>;
    public abstract getSubmissionState(submissionID: string): Promise<ICrawerResult>;
}
