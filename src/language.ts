import { existsSync, readFileSync } from "fs";
import { IFile, ILanguageInfo } from "./interfaces";

export const getLanguageInfo = (file: IFile): ILanguageInfo => {
    // if (existsSync(__dirname + `/../languages/${language}.json`)) {
    //     return JSON.parse(readFileSync(__dirname + `/../languages/${language}.json`).toString());
    // } else {
    //     throw new Error("Language rejected");
    // }
    return null;
};
