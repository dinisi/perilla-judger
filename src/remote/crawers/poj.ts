import { ICrawerResult } from "../interfaces";
import { Crawer } from "./crawer";

export class POJCrawer extends Crawer {
    private readonly POJUsername: string = "zhangzisu";
    private readonly POJPassword: string = "123456";
    public async initialize() {
        //
    }
    public async submitProblem(problemID: string): Promise<string> {
        return "";
    }
    public async getSubmissionState(submissionID: string): Promise<ICrawerResult> {
        return {
            result: {},
            status: "Accepted",
        };
    }
}
