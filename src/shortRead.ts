import { closeSync, existsSync, fstatSync, openSync, readFileSync, readSync } from "fs";

export const shortRead = (file: string) => {
    if (!existsSync(file)) { return "File not found"; }
    const fd = openSync(file, "r");
    const len = fstatSync(fd).size;
    if (len > 128) {
        const buf = Buffer.allocUnsafe(128);
        readSync(fd, buf, 0, 128, 0);
        const res = buf.toString() + "...";
        closeSync(fd);
        return res;
    } else {
        closeSync(fd);
        return readFileSync(file).toString();
    }
};
