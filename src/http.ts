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
    authorization = await new Promise<string>((res) => {
        const url = baseURL + "/login";
        const form = {
            clientID,
            password: config.password,
            rolename: "Judgers",
            username: config.username,
        };
        request.post({ url, form }, (err, httpResponse, responseBody) => {
            res(responseBody);
        });
    });
};

export const get = async (requestURL: string, queries: any): Promise<string> => {
    const q = { v: getVerificationCode(authorization, clientID) };
    Object.assign(q, queries);
    return await new Promise<string>((res) => {
        const url = baseURL + requestURL;
        const qs = q;
        const headers = { authorization };
        request.get({ url, qs, headers }, (err, httpResponse, responseBody) => {
            res(responseBody);
        });
    });
};

export const post = async (requestURL: string, queries: any, body: any): Promise<string> => {
    const q = { v: getVerificationCode(authorization, clientID) };
    Object.assign(q, queries);
    return await new Promise<string>((res) => {
        const url = baseURL + requestURL;
        const qs = q;
        const headers = { authorization, "content-type": "application/json" };
        request.post({ url, qs, headers, body, json: true }, (err, httpResponse, responseBody) => {
            res(responseBody);
        });
    });
};

export const download = async (requestURL: string, queries: any, path: string) => {
    const q = { v: getVerificationCode(authorization, clientID) };
    Object.assign(q, queries);
    return await new Promise((res) => {
        const url = baseURL + requestURL;
        const qs = q;
        const headers = { authorization };
        request.get({ url, qs, headers }).pipe(createWriteStream(path)).on("close", () => res());
    });
};
