import * as fs from "fs-extra";
import { resolve } from "path";
import { download, get } from "./http";
import { IBFileModel } from "./interfaces";

fs.ensureDirSync("files/raw");
fs.ensureDirSync("files/meta");

const getFilePath = (fileID: string) => {
    return resolve("files", "raw", fileID);
};

const getFileMetaPath = (fileID: string) => {
    return resolve("files", "meta", fileID);
};

const existsFile = (fileID: string) => {
    return fs.existsSync(getFilePath(fileID));
};

export const getFileMeta = (fileID: string): IBFileModel => {
    return JSON.parse(fs.readFileSync(getFileMetaPath(fileID)).toString()) as IBFileModel;
};

const setFileMeta = (fileID: string, meta: IBFileModel) => {
    return fs.writeFileSync(getFileMetaPath(fileID), JSON.stringify(meta));
};

const outdatedFile = async (fileID: string) => {
    if (!existsFile(fileID)) {
        const remote = JSON.parse(await get(`/api/file/${fileID}/meta`, {})) as IBFileModel;
        setFileMeta(fileID, remote);
        return true;
    } else {
        const local = getFileMeta(fileID);
        const remote = JSON.parse(await get(`/api/file/${fileID}/meta`, {})) as IBFileModel;
        const result = local.hash !== remote.hash;
        setFileMeta(fileID, remote);
        return result;
    }
};

const downloadFile = async (fileID: string) => {
    await download(`/api/file/${fileID}`, {}, getFilePath(fileID));
};

export const getFile = async (fileID: string) => {
    if (outdatedFile(fileID)) {
        downloadFile(fileID);
    }
    return getFilePath(fileID);
};
