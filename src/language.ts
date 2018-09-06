import { readFileSync } from "fs";

export const getLanguageInfo = (language: string) => {
    return JSON.parse(readFileSync(__dirname + `/../languages/${language}.json`).toString());
};
