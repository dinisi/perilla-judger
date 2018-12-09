import { readFileSync } from "fs";
import { Record, Static, String } from "runtypes";

export const IConfig = Record({
    server: String,
    username: String,
    password: String,
});

export type IConfig = Static<typeof IConfig>;

export let config: IConfig = null;

try {
    const raw = JSON.parse(readFileSync("config.json").toString());
    if (IConfig.guard(raw)) {
        config = raw;
    } else {
        throw new Error("Invalid config");
    }
} catch (e) {
    // tslint:disable-next-line:no-console
    console.log(e.message);
    process.exit(0);
}
