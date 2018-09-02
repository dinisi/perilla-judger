import * as fs from "fs-extra";
import { resolve } from "path";

fs.ensureDirSync("files");

export const getFilePath = (fileID: string) => {
    return resolve("files", fileID);
};

export const existsFile = (fileID: string) => {
    return fs.existsSync(getFilePath(fileID));
};

export const outdatedFile = async (fileID: string) => {
    //
};

export const getFile = async (fileID: string) => {
    if ((!existsFile(fileID)) || (outdatedFile(fileID))) {
        //
    }
    return getFilePath(fileID);
};
