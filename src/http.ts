import debug = require("debug");
import { createWriteStream } from "fs";
import { CoreOptions, defaults, Request, RequestAPI, RequiredUriUrl } from "request";
import { config } from "./config";

const log = debug("http");
// tslint:disable-next-line:no-var-requires
const atob = require("atob");

let request: RequestAPI<Request, CoreOptions, RequiredUriUrl> = null;
let token: string = null;

export const initialize = () => {
    request = defaults({ json: true, rejectUnauthorized: false, baseUrl: config.server });
};

const isTokenExpired = () => {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace("-", "+").replace("_", "/");
    const exp = JSON.parse(atob(base64)).exp;
    return exp < (+new Date()) / 1000;
};

const checkLogin = async () => {
    if (!token || isTokenExpired()) {
        log(token ? "Token expired" : "Not logged in");
        token = await new Promise<any>((resolve, reject) => {
            request.post("/auth/login", { body: { username: config.username, password: config.password } }, (err, response) => {
                if (err) {
                    return reject(err);
                }
                if (response.body.status !== "success") { return reject(response.body.payload); }
                resolve(response.body.payload);
            });
        });
        log("New token: " + token.split(".")[1]);
    }
};

export const get = async (url: string, qs: any) => {
    log("GET %s", url);
    await checkLogin();
    return new Promise<any>((resolve, reject) => {
        request.get(url, { qs, headers: { "x-access-token": token } }, (err, response) => {
            if (err) {
                return reject(err);
            }
            if (response.body.status !== "success") { return reject(response.body.payload); }
            resolve(response.body.payload);
        });
    });
};

export const post = async (url: string, qs: any, body: any) => {
    log("POST %s", url);
    await checkLogin();
    return new Promise<any>((resolve, reject) => {
        request.post(url, { qs, headers: { "x-access-token": token }, body }, (err, response) => {
            if (err) {
                return reject(err);
            }
            if (response.body.status !== "success") { return reject(response.body.payload); }
            resolve(response.body.payload);
        });
    });
};

export const download = async (url: string, qs: any, path: string) => {
    log("GET %s", url);
    await checkLogin();
    return new Promise<any>((resolve) => {
        request.get(url, { qs, headers: { "x-access-token": token } }).pipe(createWriteStream(path)).on("close", resolve);
    });
};
