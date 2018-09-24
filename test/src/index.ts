import { LYDSYRobot } from "./lydsy";

(async () => {
    const robot = new LYDSYRobot("zzsdev", "123456");
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
