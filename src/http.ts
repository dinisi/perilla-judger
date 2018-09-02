import { pbkdf2Sync } from "crypto";
import { generate } from "randomstring";
import * as request from "request-promise-native";
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
    authorization = (await request.post(baseURL + "/login").form({ username: config.username, password: config.password, rolename: "Judgers", clientID })).body.toString();
};

export const get = async (url: string, queries: any) => {
    const q = { v: getVerificationCode(authorization, clientID) };
    Object.assign(q, queries);
    await request.get(baseURL + url, { qs: q, headers: { authorization } });
};
