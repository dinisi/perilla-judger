import { ensureDirSync, existsSync, readFileSync, writeFileSync } from "fs-extra";
import { resolve } from "path";
import { download, get } from "./http";
import { IFile } from "./interfaces";

ensureDirSync("files");

const getFilePath = (fileID: string) => {
    return resolve("files", fileID + ".raw");
};

const getFileMetaPath = (fileID: string) => {
    return resolve("files", fileID + ".meta");
};

const existsFile = (fileID: string) => {
    return existsSync(getFilePath(fileID));
};

const getFileMeta = (fileID: string) => {
    return JSON.parse(readFileSync(getFileMetaPath(fileID)).toString());
};

const setFileMeta = (fileID: string, meta: any) => {
    return writeFileSync(getFileMetaPath(fileID), JSON.stringify(meta));
};

const ensureFile = async (fileID: string) => {
    try {
        if (!existsFile(fileID)) {
            const remote = await get(`/api/system/file`, { id: fileID });
            if (!remote || (typeof remote !== "object")) { throw new Error(); }
            setFileMeta(fileID, remote);
            await download(`/api/system/file/raw`, { id: fileID }, getFilePath(fileID));
        } else {
            const local = getFileMeta(fileID);
            const remote = await get(`/api/file`, { id: fileID });
            if (local.hash !== remote.hash) {
                await download(`/api/system/file/raw`, { id: fileID }, getFilePath(fileID));
            }
            setFileMeta(fileID, remote);
        }
    } catch (e) {
        throw e;
    }
};

export const getFile = async (fileID: string): Promise<IFile> => {
    try {
        await ensureFile(fileID);
        return { path: getFilePath(fileID), type: getFileMeta(fileID).type };
    } catch (e) {
        throw e;
    }
};
