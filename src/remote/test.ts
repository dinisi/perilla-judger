import { launchChrome } from "../chromeHelper";
import * as poj from "./crawers/poj";

const solution =
    `
int main()
{
    int a,b;
    cin >> a >> b;
    cout << a+b << endl;
    return 0;
}
`;

(async () => {
    await launchChrome();
    await poj.initialize();
    // console.log(await poj.submitProblem("1000", solution, "cpp"));
    // tslint:disable-next-line:no-console
    console.log(await poj.getSubmissionState("19218036"));
})();
