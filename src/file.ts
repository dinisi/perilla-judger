import { ensureDirSync, existsSync } from "fs-extra";
import { join } from "path";
import { download, get } from "./http";
import { IFileModel } from "./interfaces";

const cachePath = "cache";
ensureDirSync(cachePath);

export const getFile = async (owner: string, id: number) => {
    const info = await get("/api/judger/resolve", { owner, id }) as IFileModel;
    const path = join(cachePath, info.hash);
    if (!existsSync(path)) {
        await download("/api/judger/download", { hash: info.hash }, path);
    }
    return { path, info };
};
