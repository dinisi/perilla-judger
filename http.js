const createWriteStream = require("fs").createWriteStream;
const generate = require("randomstring").generate;
const request = require("request");

let authorization;
let clientID;
let baseURL;

exports.initialize = async (server, username, password) => {
    // tslint:disable-next-line:no-console
    console.log("[INFO] [HTTP] HTTP Helper is initializing");
    baseURL = server;
    clientID = generate(50);
    try {
        authorization = await new Promise((res, rej) => {
            const url = baseURL + "/login";
            const body = {
                clientID,
                password: password,
                username: username,
            };
            request.post({ url, body, json: true, rejectUnauthorized: false }, (err, response) => {
                if (err) {
                    rej(err);
                } else {
                    if (response.body.status !== "success") { rej(response.body.payload); }
                    res(response.body.payload);
                }
            });
        });
        // tslint:disable-next-line:no-console
        console.log("[INFO] [HTTP] HTTP Helper is initialized");
    } catch (e) {
        // tslint:disable-next-line:no-console
        console.log("Login failed");
        process.exit(0);
    }
};

exports.get = async (requestURL, queries) => {
    const q = { c: clientID, a: authorization };
    Object.assign(q, queries);
    return new Promise((res, rej) => {
        const url = baseURL + requestURL;
        const qs = q;
        request.get({ url, qs, json: true, rejectUnauthorized: false }, (err, response) => {
            if (err) {
                rej(err);
            } else {
                if (response.body.status !== "success") { rej(response.body.payload); }
                res(response.body.payload);
            }
        });
    });
};

exports.post = async (requestURL, queries, body) => {
    const q = { c: clientID, a: authorization };
    Object.assign(q, queries);
    return new Promise((res, rej) => {
        const url = baseURL + requestURL;
        const qs = q;
        request.post({ url, qs, body, json: true, rejectUnauthorized: false }, (err, response) => {
            if (err) {
                rej(err);
            } else {
                if (response.body.status !== "success") { rej(response.body.payload); }
                res(response.body.payload);
            }
        });
    });
};

exports.download = async (requestURL, queries, path) => {
    const q = { c: clientID, a: authorization };
    Object.assign(q, queries);
    return new Promise((res, rej) => {
        const url = baseURL + requestURL;
        const qs = q;
        const headers = { authorization };
        request.get({ url, qs, headers, rejectUnauthorized: false }).pipe(createWriteStream(path)).on("close", () => res()).on("error", () => rej());
    });
};
