import { JSDOM } from "jsdom";
import { agent, SuperAgent, SuperAgentRequest } from "superagent";
import { Robot } from "./base";

export class HDURobot extends Robot {
    private agent: SuperAgent<SuperAgentRequest> = null;
    private continuesStatus = ["Queuing", "Compiling", "Running"];
    public constructor(username: string, password: string) {
        super(username, password);
    }
    public async isLoggedIn() {
        const result = await this.agent.get("http://acm.hdu.edu.cn/control_panel.php");
        return result.status === 200;
    }
    public async initalize() {
        this.agent = agent();
        const result = await this.agent
            .post("http://acm.hdu.edu.cn/userloginex.php?action=login")
            .send({ username: this.username, userpass: this.password, login: "Sign In" })
            .set("Content-Type", "application/x-www-form-urlencoded")
            .set("Referer", "http://acm.hdu.edu.cn/")
            .set("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.22 Safari/537.36")
            .set("Host", "acm.hdu.edu.cn")
            .set("Cache-Control", "max-age=0")
            .set("Origin", "http://acm.hdu.edu.cn")
            .redirects(1);
        if (!await this.isLoggedIn()) { throw new Error("Login failed"); }
    }
    public async submit(problemID: string, code: string, language: string) {
        let langcode = null;
        switch (language) {
            case "c": langcode = 1; break;
            case "cpp": langcode = 0; break;
            case "java": langcode = 5; break;
        }
        if (langcode === null) { throw new Error("Language Rejected"); }
        const result = await this.agent
            .post("http://acm.hdu.edu.cn/submit.php?action=submit")
            .send({ check: "0", problemid: problemID, language: langcode, usercode: code })
            .set("Content-Type", "application/x-www-form-urlencoded")
            .set("Referer", "http://acm.hdu.edu.cn/submit.php?action=submit")
            .redirects(2);
        const dom = new JSDOM(result.text);
        const resultTable = dom.window.document.querySelector('table[width="100%"][border="0"][align="center"][cellspacing="2"][class="table_text"]');
        const resultRows = resultTable.querySelectorAll('tr[align="center"]');
        for (const resultRow of resultRows) {
            if (resultRow.lastElementChild.textContent !== this.username) { continue; }
            return resultRow.firstElementChild.textContent;
        }
        throw new Error("Submit failed");
    }
    public async fetch(originID: string) {
        const url = `http://acm.hdu.edu.cn/status.php?first=${originID}&user=&pid=&lang=&status=#status`;
        const result = await this.agent.get(url);
        const dom = new JSDOM(result.text);
        const resultTable = dom.window.document.querySelector('table[width="100%"][border="0"][align="center"][cellspacing="2"][class="table_text"]');
        const resultRow = resultTable.querySelector('tr[align="center"]');
        const status = resultRow.childNodes[2].textContent;
        return {
            result: {
                info: {
                    runID: resultRow.childNodes[0].textContent,
                    remoteUser: resultRow.childNodes[8].textContent,
                    remoteProblem: resultRow.childNodes[3].textContent,
                    size: resultRow.childNodes[6].textContent,
                    submitTime: resultRow.childNodes[1].textContent,
                },
                memory: resultRow.childNodes[5].textContent,
                time: resultRow.childNodes[4].textContent,
            },
            status,
            continuous: this.continuesStatus.includes(status),
        };
    }
}
