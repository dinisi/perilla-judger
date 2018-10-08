const fs = require("fs-extra");
const resolve = require("path").resolve;
const http = require("./http");

fs.ensureDirSync("files");

const getFilePath = (fileID) => {
    return resolve("files", fileID + ".raw");
};

const getFileMetaPath = (fileID) => {
    return resolve("files", fileID + ".meta");
};

const existsFile = (fileID) => {
    return fs.existsSync(getFilePath(fileID));
};

const getFileMeta = (fileID) => {
    return JSON.parse(fs.readFileSync(getFileMetaPath(fileID)).toString());
};

const setFileMeta = (fileID, meta) => {
    return fs.writeFileSync(getFileMetaPath(fileID), JSON.stringify(meta));
};

const ensureFile = async (fileID) => {
    try {
        if (!existsFile(fileID)) {
            const remote = await http.get(`/api/file/${fileID}`, {});
            if (!remote || (typeof remote !== "object")) { throw new Error(); }
            setFileMeta(fileID, remote);
            await http.download(`/api/file/${fileID}/raw`, {}, getFilePath(fileID));
            return true;
        } else {
            const local = getFileMeta(fileID);
            const remote = await http.get(`/api/file/${fileID}`, {});
            const result = local.hash !== remote.hash;
            setFileMeta(fileID, remote);
            return result;
        }
    } catch (e) {
        throw e;
    }
};

exports.getFile = async (fileID) => {
    try {
        await ensureFile(fileID);
        const result = getFileMeta(fileID);
        result.path = getFilePath(fileID);
        return result;
    } catch (e) {
        throw e;
    }
};
