import * as fs from "fs-extra";
import { resolve } from "path";
import { download, get } from "./http";
import { IBFileModel } from "./interfaces";

fs.ensureDirSync("files");

const getFilePath = (fileID: string) => {
    return resolve("files", fileID + ".raw");
};

const getFileMetaPath = (fileID: string) => {
    return resolve("files", fileID + ".meta");
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
        const remote = await get(`/api/file/${fileID}`, {}) as IBFileModel;
        setFileMeta(fileID, remote);
        return true;
    } else {
        const local = getFileMeta(fileID);
        const remote = await get(`/api/file/${fileID}`, {}) as IBFileModel;
        const result = local.hash !== remote.hash;
        setFileMeta(fileID, remote);
        return result;
    }
};

const downloadFile = async (fileID: string) => {
    await download(`/api/file/${fileID}/raw`, {}, getFilePath(fileID));
};

export const getFile = async (fileID: string) => {
    if (await outdatedFile(fileID)) {
        await downloadFile(fileID);
    }
    return getFilePath(fileID);
};
