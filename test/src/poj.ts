import { JSDOM } from "jsdom";
import { agent, SuperAgent, SuperAgentRequest } from "superagent";

let sa: SuperAgent<SuperAgentRequest> = null;
async function isLoggedIn() {
    const result = await sa.get("http://poj.org/mail");
    return result.status === 200;
}
async function login(username: string, password: string) {
    sa = agent();
    const result = await sa
        .post("http://poj.org/login")
        .send({ user_id1: username, password1: password, B1: "login", url: "/" })
        .set("Content-Type", "application/x-www-form-urlencoded")
        .set("Referer", "http://poj.org/")
        .redirects(2);
    if (!await isLoggedIn()) { throw new Error("Login failed"); }
}
async function submit(problemID: string, code: string, language: string) {
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
    const result = await sa
        .post("http://poj.org/submit")
        .send({ problem_id: problemID, language: langcode, source: code, submit: "Submit", encoded: 0 })
        .set("Referer", "http://poj.org/submit?problem_id=" + problemID)
        .set("Content-Type", "application/x-www-form-urlencoded")
        .redirects(2);
    // tslint:disable-next-line:no-console
    const dom = new JSDOM(result.text);
    const resultTable = dom.window.document.querySelector('table[cellspacing="0"][cellpadding="0"][width="100%"][border="1"][class="a"][bordercolor="#FFFFFF"]');
    const resultRow = resultTable.querySelector('tr[align="center"]');
    const runID = resultRow.childNodes[0].textContent;
    return runID;
}

async function fetch(originID: string) {
    const parsed = parseInt(originID, 10);
    const top = parsed + 1;
    const url = `http://poj.org/status?top=${top}`;
    const result = await sa.get(url);
    // tslint:disable-next-line:no-console
    console.log(result.text);
}

(async () => {
    await login("zhangzisu_develop", "123456");
    // tslint:disable-next-line:no-console
    console.log("Login succeed");
    // await submit("1000", "#include <iostream>\nusing namespace std;\nint main()\n{\nint a,b;\ncin >> a >> b;\ncout << a+b << endl;\nreturn 0;\n}\n", "CPP");
    await fetch("19276986");
})();
