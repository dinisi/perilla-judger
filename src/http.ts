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
    authorization = await new Promise<string>((res, rej) => {
        const url = baseURL + "/login";
        const form = {
            clientID,
            password: config.password,
            rolename: "Judgers",
            username: config.username,
        };
        request.post({ url, form }, (err, httpResponse, responseBody) => {
            if (err) {
                rej(err);
            } else {
                const parsed = JSON.parse(responseBody);
                if (parsed.status !== "success") { rej(parsed.payload); }
                res(parsed.payload);
            }
        });
    });
};

export const get = async (requestURL: string, queries: any): Promise<string> => {
    const q = { v: getVerificationCode(authorization, clientID), a: authorization };
    Object.assign(q, queries);
    return await new Promise<string>((res, rej) => {
        const url = baseURL + requestURL;
        const qs = q;
        request.get({ url, qs }, (err, httpResponse, responseBody) => {
            if (err) {
                rej(err);
            } else {
                const parsed = JSON.parse(responseBody);
                if (parsed.status !== "success") { rej(parsed.payload); }
                res(parsed.payload);
            }
        });
    });
};

export const post = async (requestURL: string, queries: any, form: any): Promise<string> => {
    const q = { v: getVerificationCode(authorization, clientID), a: authorization };
    Object.assign(q, queries);
    return await new Promise<string>((res, rej) => {
        const url = baseURL + requestURL;
        const qs = q;
        request.post({ url, qs, form }, (err, httpResponse, responseBody) => {
            if (err) {
                rej(err);
            } else {
                const parsed = JSON.parse(responseBody);
                if (parsed.status !== "success") { rej(parsed.payload); }
                res(parsed.payload);
            }
        });
    });
};

export const download = async (requestURL: string, queries: any, path: string) => {
    const q = { v: getVerificationCode(authorization, clientID), a: authorization };
    Object.assign(q, queries);
    return await new Promise((res, rej) => {
        const url = baseURL + requestURL;
        const qs = q;
        const headers = { authorization };
        request.get({ url, qs, headers }).pipe(createWriteStream(path)).on("close", () => res()).on("error", () => rej());
    });
};
