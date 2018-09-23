import { JSDOM } from "jsdom";
import { agent, SuperAgent, SuperAgentRequest } from "superagent";
import { Robot } from "./base";

export class POJRobot extends Robot {
    private agent: SuperAgent<SuperAgentRequest> = null;
    private continuesStatus = ["Queuing", "Compiling", "Running"];
    public constructor(username: string, password: string) {
        super(username, password);
    }
    public async isLoggedIn() {
        const result = await this.agent.get("http://poj.org/mail");
        return result.status === 200;
    }
    public async initalize() {
        this.agent = agent();
        const result = await this.agent
            .post("http://poj.org/login")
            .send({ user_id1: this.username, password1: this.password, B1: "login", url: "/" })
            .set("Content-Type", "application/x-www-form-urlencoded")
            .set("Referer", "http://poj.org/")
            .redirects(2);
        if (!await this.isLoggedIn()) { throw new Error("Login failed"); }
    }
    public async submit(problemID: string, code: string, language: string) {
        let langcode = null;
        switch (language) {
            case "C":
                langcode = 1;
                break;
            case "CPP":
                langcode = 0;
                break;
            case "Java":
                langcode = 2;
                break;
        }
        if (langcode === null) { throw new Error("Language"); }
        const result = await this.agent
            .post("http://poj.org/submit")
            .send({ problem_id: problemID, language: langcode, source: code, submit: "Submit", encoded: 0 })
            .set("Referer", "http://poj.org/submit?problem_id=" + problemID)
            .set("Content-Type", "application/x-www-form-urlencoded")
            .redirects(2);
        const dom = new JSDOM(result.text);
        const resultTable = dom.window.document.querySelector('table[cellspacing="0"][cellpadding="0"][width="100%"][border="1"][class="a"][bordercolor="#FFFFFF"]');
        const resultRow = resultTable.querySelector('tr[align="center"]');
        const runID = resultRow.childNodes[0].textContent;
        return runID;
    }
    public async fetch(originID: string) {
        const parsed = parseInt(originID, 10);
        const top = parsed + 1;
        const url = `http://poj.org/status?top=${top}`;
        const result = await this.agent.get(url);
        const dom = new JSDOM(result.text);
        const resultTable = dom.window.document.querySelector('table[cellspacing="0"][cellpadding="0"][width="100%"][border="1"][class="a"][bordercolor="#FFFFFF"]');
        const resultRow = resultTable.querySelector('tr[align="center"]');
        const status = resultRow.childNodes[3].textContent;
        return {
            result: {
                info: {
                    runID: resultRow.childNodes[0].textContent,
                    remoteUser: resultRow.childNodes[1].textContent,
                    remoteProblem: resultRow.childNodes[2].textContent,
                    size: resultRow.childNodes[6].textContent,
                    submitTime: resultRow.childNodes[7].textContent,
                },
                memory: resultRow.childNodes[4].textContent,
                time: resultRow.childNodes[5].textContent,
            },
            status,
            continuous: this.continuesStatus.includes(status),
        };
    }
}
