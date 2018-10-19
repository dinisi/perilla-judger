import { IFile, ISolution, IUpdateCallback } from "../../interfaces";
import { IRobotFetchResult } from "../interfaces";

type updateCallback = (solution: ISolution) => Promise<void>;

export abstract class Robot {
    protected username: string;
    protected password: string;
    public constructor(username: string, password: string) {
        this.username = username;
        this.password = password;
    }
    public abstract getName(): string;
    public abstract isLoggedIn(): Promise<boolean>;
    public abstract initialize(): Promise<void>;
    public abstract submit(problemID: string, file: IFile, callback: updateCallback): Promise<string>;
    public abstract fetch(originID: string): Promise<IRobotFetchResult>;
}
