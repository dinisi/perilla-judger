import { existsSync, readFileSync } from "fs";

export const getLanguageInfo = (language: string) => {
    if (existsSync(__dirname + `/../languages/${language}.json`)) {
        return JSON.parse(readFileSync(__dirname + `/../languages/${language}.json`).toString());
    } else {
        throw new Error("Language rejected");
    }
};
