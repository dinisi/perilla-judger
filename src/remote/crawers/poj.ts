import { Page } from "puppeteer";
import { declarePage } from "../../chromeHelper";
import { ICrawerResult } from "../interfaces";

const POJUsername: string = "zhangzisu";
const POJPassword: string = "1234567890zzs";
let page: Page = null;
const languageMap: any = {
    c: 1,
    cpp: 0,
    java: 2,
};

export const initialize = async () => {
    page = await declarePage();
    await page.goto("http://poj.org/");
    await page.evaluate((username, password) => {
        (document as any).getElementsByName("user_id1")[0].value = username;
        (document as any).getElementsByName("password1")[0].value = password;
        (document as any).querySelector('input[type="Submit"][value="login"]').click();
    }, POJUsername, POJPassword);
    await page.waitForNavigation();
};
export const submitProblem = async (problemID: string, source: string, language: string): Promise<string> => {
    if (languageMap[language] === null) { throw new Error("Language rejected"); }
    const res = await page.goto(`http://poj.org/submit?problem_id=${problemID}`);
    if (res.status() !== 200) { throw new Error("Origin server rejected"); }
    await page.evaluate((sourceText, languageID) => {
        (document as any).getElementById("source").value = sourceText;
        (document as any).querySelector('select[name="language"]').value = languageID;
    }, source, languageMap[language]);
    await page.click('input[value="Submit"][value="Submit"][name="submit"]');
    await page.waitForNavigation();
    return await page.evaluate(() => {
        const t = document.querySelector("table.a") as any;
        return t.childNodes[0].childNodes[2].childNodes[0].textContent;
    });
};
export const getSubmissionState = async (submissionID: string): Promise<ICrawerResult> => {
    await page.goto(`http://poj.org/showsource?solution_id=${submissionID}`);
    const text: string = await page.evaluate(() => {
        return document.querySelector("tbody").textContent.split("\n").map((x) => x.trim()).filter((x) => x.length).join("");
    });
    const splitted = text.replace("Memory: ", "$").replace("Time: ", "$").replace("Language: ", "$").replace("Result: ", "$").split("$");
    return {
        finished: splitted[4] !== "Running & Judging" && splitted[4] !== "Waiting",
        result: {
            memory: splitted[1],
            time: splitted[2],
        },
        status: splitted[4],
    };
};
