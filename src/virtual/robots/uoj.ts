/**
 * @deprecated This crawer is very slow
 */

import { Browser, launch } from "puppeteer";
import { Robot } from "./base";
import { IRobotFetchResult } from "../interfaces";

export default class UOJRobot extends Robot {
    private browser: Browser = null;
    private finalStatus = ["Compile Error", "Judgement Failed"];
    public constructor(username: string, password: string) {
        super(username, password);
    }
    public getName() { return "uoj"; }
    public async isLoggedIn() {
        const page = await this.browser.newPage();
        try {
            const res = await page.goto("http://uoj.ac/user/msg");
            const failed = (res.status() !== 200) || !(/私信/.test(await res.text()));
            await page.close();
            return !failed;
        } catch (e) {
            await page.close();
            throw e;
        }
    }
    public async initialize() {
        // tslint:disable-next-line:no-console
        console.log("[INFO] [Robots] UOJ Robot is initializing");
        this.browser = await launch({ args: ["--no-sandbox"] });
        const page = await this.browser.newPage();
        try {
            await page.goto("http://uoj.ac/login");
            await page.evaluate((username, password) => {
                (document.getElementById("input-username") as any).value = username;
                (document.getElementById("input-password") as any).value = password;
                document.getElementById("button-submit").click();
            }, this.username, this.password);
            await page.waitForNavigation();
            await page.close();
            // tslint:disable-next-line:no-console
            console.log("[INFO] [Robots] UOJ Robot is initialized");
        } catch (e) {
            await page.close();
            throw e;
        }
    }
    public async submit(problemID: string, code: string, language: string) {
        let langcode = null;
        switch (language) {
            case "c": langcode = "C"; break;
            case "cpp": langcode = "C++11"; break;
            case "pas": langcode = "Pascal"; break;
            case "java": langcode = "Java8"; break;
            case "py": langcode = "Python3"; break;
        }
        if (langcode === null) { throw new Error("Language Rejected"); }
        const page = await this.browser.newPage();
        try {
            await page.goto(`http://uoj.ac/problem/${problemID}`);
            // tslint:disable-next-line:no-shadowed-variable
            await page.evaluate((code, language) => {
                (document.querySelector('a[href="#tab-submit-answer"]') as any).click();
                (document.getElementById("input-answer_answer_language") as any).value = language;
                (document.getElementById("input-answer_answer_editor") as any).value = code;
                document.getElementById("button-submit-answer").click();
            }, code, langcode);
            await page.waitForNavigation();
            const runID: string = await page.evaluate(() => {
                return document.querySelector('table[class="table table-bordered table-hover table-striped table-text-center"]').lastElementChild.firstElementChild.firstElementChild.textContent;
            });
            if (!runID) { throw new Error("Submit failed"); }
            await page.close();
            return runID.substr(1, runID.length - 1);
        } catch (e) {
            await page.close();
            throw e;
        }
    }
    public async fetch(originID: string) {
        // const url = `http://uoj.ac/submission/${originID}`;
        // const page = await this.browser.newPage();
        // try {
        //     await page.goto(url);
        //     const result = await page.evaluate(() => {
        //         const tr = document.childNodes[1].childNodes[2].childNodes[1].childNodes[5].childNodes[1].childNodes[0].childNodes[1].childNodes[0];
        //         return {
        //             originID: tr.childNodes[0].textContent,
        //             originProblem: tr.childNodes[1].textContent,
        //             originSubmitter: tr.childNodes[2].textContent,
        //             originStatus: tr.childNodes[3].textContent,
        //             time: tr.childNodes[4].textContent,
        //             memory: tr.childNodes[5].textContent,
        //             size: tr.childNodes[7].textContent,
        //             submitTime: tr.childNodes[8].textContent,
        //             judgeTime: tr.childNodes[9].textContent,
        //         };
        //     });
        //     await page.close();
        //     if (parseInt(result.originStatus, 10)) {
        //         const score = parseInt(result.originStatus, 10);
        //         return {
        //             result: {
        //                 info: {
        //                     runID: result.originID,
        //                     remoteUser: result.originSubmitter,
        //                     remoteProblem: result.originProblem,
        //                     size: result.size,
        //                     submitTime: result.submitTime,
        //                     judgeTime: result.judgeTime,
        //                 },
        //                 time: result.time,
        //                 memory: result.memory,
        //             },
        //             status: score === 100 ? "Accepted" : "Unacceptable",
        //             continuous: false,
        //         };
        //     } else {
        //         return {
        //             result: {
        //                 info: {
        //                     runID: result.originID,
        //                     remoteUser: result.originSubmitter,
        //                     remoteProblem: result.originProblem,
        //                     size: result.size,
        //                     submitTime: result.submitTime,
        //                     judgeTime: result.judgeTime,
        //                 },
        //                 time: result.time,
        //                 memory: result.memory,
        //             },
        //             status: result.originStatus,
        //             continuous: !this.finalStatus.includes(result.originStatus),
        //         };
        //     }
        // } catch (e) {
        //     await page.close();
        //     throw e;
        // }
        return null as IRobotFetchResult;
    }
}
