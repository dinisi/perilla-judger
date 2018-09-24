import { LYDSYRobot } from "./lydsy";
import { UOJRobot } from "./uoj";

(async () => {
    const robot = new UOJRobot("zhangzisu_develop", "78d58440fec80641ab0a63e1d4a27337");
    await robot.initalize();
    const runID = await robot.submit("1000",
    `
#include <iostream>

using namespace std;

int main()
{
    int a,b;
    cin >> a >> b;
    cout << a+b << endl;
    return 0;
}
    `, "cpp");
    // tslint:disable-next-line:no-console
    console.log(runID);
    // const result = await robot.fetch()
})();
