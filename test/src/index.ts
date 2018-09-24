import { LYDSYRobot } from "./lydsy";
import { UOJRobot } from "./uoj";

(async () => {
    const robot = new UOJRobot("zhangzisu_develop", "123456");
    await robot.initalize();
    // tslint:disable-next-line:no-console
    console.log(await robot.fetch("287100"));
    // const result = await robot.fetch()
})();
