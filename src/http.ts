import debug = require("debug");
import { createWriteStream } from "fs";
import { CoreOptions, defaults, Request, RequestAPI, RequiredUriUrl } from "request";

const log = debug("http");

let request: RequestAPI<Request, CoreOptions, RequiredUriUrl> = null;

export const initialize = (server: string, username: string, password: string) => {
    log("HTTP Helper is initializing");
    request = defaults({ jar: true, json: true, rejectUnauthorized: false, baseUrl: server });
    return new Promise<void>((resolve, reject) => {
        const body = { username, password };
        request.post("/api/misc/login", { body }, (err, response) => {
            if (err) {
                log(err);
                process.exit(0);
            }
            if (response.body.status !== "success") { return reject(response.body.payload); }
            log("[INFO] [HTTP] HTTP Helper is initialized");
            resolve();
        });
    });
};

export const get = (url: string, qs: any) => {
    log("GET %s", url);
    return new Promise<any>((resolve, reject) => {
        request.get(url, { qs }, (err, response) => {
            if (err) {
                return reject(err);
            }
            if (response.body.status !== "success") { return reject(response.body.payload); }
            resolve(response.body.payload);
        });
    });
};

export const post = (url: string, qs: any, body: any) => {
    log("POST %s", url);
    return new Promise<any>((resolve, reject) => {
        request.post(url, { qs, body }, (err, response) => {
            if (err) {
                return reject(err);
            }
            if (response.body.status !== "success") { return reject(response.body.payload); }
            resolve(response.body.payload);
        });
    });
};

export const download = (url: string, qs: any, path: string) => {
    log("GET %s", url);
    return new Promise<any>((resolve) => {
        request.get(url, { qs }).pipe(createWriteStream(path)).on("close", resolve);
    });
};
