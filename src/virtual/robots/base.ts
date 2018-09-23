import { IResult, IRobotFetchResult } from "../interfaces";

export abstract class Robot {
    protected username: string;
    protected password: string;
    public constructor(username: string, password: string) {
        this.username = username;
        this.password = password;
    }
    public abstract isLoggedIn(): Promise<boolean>;
    public abstract initalize(): Promise<void>;
    public abstract submit(problemID: string, code: string, language: string): Promise<string>;
    public abstract fetch(originID: string): Promise<IRobotFetchResult>;
}
