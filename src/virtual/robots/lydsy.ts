// import { JSDOM } from "jsdom";
// import { agent, SuperAgent, SuperAgentRequest } from "superagent";
// import { SolutionResult } from "../../interfaces";
// import { IStatusMapper } from "../interfaces";
// import { Robot } from "./base";

// export default class LYDSYRobot extends Robot {
//     private agent: SuperAgent<SuperAgentRequest> = null;
//     private continuesStatus = ["Pending", "Pending_Rejudging", "Compiling", "Running_&_Judging", "Waiting"];
//     private statusMap: IStatusMapper = {
//         Pending: SolutionResult.Judging,
//     };
//     public constructor(username: string, password: string) {
//         super(username, password);
//     }
//     public getName() { return "lydsy"; }
//     public async isLoggedIn() {
//         const result = await this.agent.get("https://www.lydsy.com/JudgeOnline/modifypage.php");
//         return result.status === 200 && /Update Information/.test(result.text);
//     }
//     public async initialize() {
//         // tslint:disable-next-line:no-console
//         console.log("[INFO] [Robots] LYDSY Robot is initializing");
//         this.agent = agent();
//         const result = await this.agent
//             .post("https://www.lydsy.com/JudgeOnline/login.php")
//             .send({ user_id: this.username, password: this.password, submit: "Submit" })
//             .set("Content-Type", "application/x-www-form-urlencoded")
//             .set("Referer", "https://www.lydsy.com/JudgeOnline/loginpage.php")
//             .redirects(2);
//         if (!await this.isLoggedIn()) { throw new Error("Login failed"); }
//         // tslint:disable-next-line:no-console
//         console.log("[INFO] [Robots] LYDSY Robot is initialized");
//     }
//     public async submit(problemID: string, code: string, language: string) {
//         let langcode = null;
//         switch (language) {
//             case "c": langcode = 0; break;
//             case "cpp": langcode = 1; break;
//             case "pas": langcode = 2; break;
//             case "java": langcode = 3; break;
//             case "py": langcode = 6; break;
//         }
//         if (langcode === null) { throw new Error("Language Rejected"); }
//         const result = await this.agent
//             .post("https://www.lydsy.com/JudgeOnline/submit.php")
//             .send({ id: problemID, language: langcode, source: code })
//             .set("Content-Type", "application/x-www-form-urlencoded")
//             .set("Referer", `https://www.lydsy.com/JudgeOnline/submitpage.php?id=${problemID}`)
//             .redirects(2);
//         const dom = new JSDOM(result.text);
//         const resultTable = dom.window.document.querySelector('table[align="center"]');
//         const resultRows = resultTable.querySelectorAll('tr[align="center"]');
//         for (const resultRow of resultRows) {
//             if (resultRow.childNodes[1].textContent !== this.username) { continue; }
//             return resultRow.childNodes[0].textContent;
//         }
//         throw new Error("Submit failed");
//     }
//     public async fetch(originID: string) {
//         const url = `https://www.lydsy.com/JudgeOnline/status.php?&top=${originID}`;
//         const result = await this.agent.get(url);
//         const dom = new JSDOM(result.text);
//         const resultTable = dom.window.document.querySelector('table[align="center"]');
//         const resultRow = resultTable.querySelector('tr[align="center"]');
//         const statusText = resultRow.childNodes[3].textContent;
//         const info = [
//             `Fetch result at ${new Date()}`,
//             `RunID: ${resultRow.childNodes[0].textContent}, RemoteUser: ${resultRow.childNodes[1].textContent}`,
//             `Time: ${resultRow.childNodes[5].textContent} Memory: ${resultRow.childNodes[4].textContent}`,
//         ].join("\n");
//         return {
//             log: info,
//             status: this.statusMap[statusText],
//             continuous: this.continuesStatus.includes(statusText),
//         };
//     }
// }
