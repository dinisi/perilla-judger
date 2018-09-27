import { pbkdf2Sync } from "crypto";
import { createWriteStream } from "fs";
import { generate } from "randomstring";
import * as request from "request";
import { IJudgerConfig } from "./interfaces";

const getFuzzyTime = () => {
    const date = new Date();
    return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}-${date.getUTCHours()}`;
};

const getVerificationCode = (auth: string, cid: string) => {
    return pbkdf2Sync(`${auth}.${getFuzzyTime()}`, cid, 1000, 64, "sha512").toString("hex");
};

let authorization: string;
let clientID: string;
let baseURL: string;

export const initialize = async (config: IJudgerConfig) => {
    baseURL = config.server;
    clientID = generate(50);
    try {
        authorization = await new Promise<string>((res, rej) => {
            const url = baseURL + "/login";
            const body = {
                clientID,
                password: config.password,
                username: config.username,
            };
            request.post({ url, body, json: true }, (err, response) => {
                if (err) {
                    rej(err);
                } else {
                    if (response.body.status !== "success") { rej(response.body.payload); }
                    res(response.body.payload);
                }
            });
        });
    } catch (e) {
        // tslint:disable-next-line:no-console
        console.log("Login failed");
        process.exit(0);
    }
};

export const get = async (requestURL: string, queries: any): Promise<any> => {
    const q = { c: clientID, a: authorization };
    Object.assign(q, queries);
    return new Promise<any>((res, rej) => {
        const url = baseURL + requestURL;
        const qs = q;
        request.get({ url, qs, json: true }, (err, response) => {
            if (err) {
                rej(err);
            } else {
                if (response.body.status !== "success") { rej(response.body.payload); }
                res(response.body.payload);
            }
        });
    });
};

export const post = async (requestURL: string, queries: any, body: any): Promise<any> => {
    const q = { c: clientID, a: authorization };
    Object.assign(q, queries);
    return new Promise<any>((res, rej) => {
        const url = baseURL + requestURL;
        const qs = q;
        request.post({ url, qs, body, json: true }, (err, response) => {
            if (err) {
                rej(err);
            } else {
                if (response.body.status !== "success") { rej(response.body.payload); }
                res(response.body.payload);
            }
        });
    });
};

export const download = async (requestURL: string, queries: any, path: string) => {
    const q = { c: clientID, a: authorization };
    Object.assign(q, queries);
    return new Promise<void>((res, rej) => {
        const url = baseURL + requestURL;
        const qs = q;
        const headers = { authorization };
        request.get({ url, qs, headers }).pipe(createWriteStream(path)).on("close", () => res()).on("error", () => rej());
    });
};
