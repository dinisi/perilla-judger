import { readFileSync } from "fs";
import { getFile, getFileMeta } from "../file";
import { IJudgerConfig, IProblemModel, ISolutionModel } from "../interfaces";
import { updateSolution } from "../solution";
import * as poj from "./crawers/poj";
import { ICrawerResult } from "./interfaces";
const crawers: any = {
    poj,
};

export const remote = async (config: IJudgerConfig, solution: ISolutionModel, problem: IProblemModel) => {
    const oj = problem.data.oj;
    const id = problem.data.id;
    solution.status = "Initialized";
    solution.result.score = 0;
    await updateSolution(solution);
    if (crawers[oj] === null) {
        solution.status = "No such OJ";
        await updateSolution(solution);
        return;
    }
    const sourceFile = await getFile(solution.files[0]);
    const sourceLang = await getFileMeta(solution.files[0]).type;
    const submission = await crawers[oj].submitProblem(id, readFileSync(sourceFile).toString(), sourceLang);
    const track = async (sid: string, crawer: any) => {
        const crawerResult = await crawer.getSubmissionState(sid) as ICrawerResult;
        solution.status = crawerResult.status;
        solution.result = crawerResult.result;
        if (!crawerResult.finished) {
            setTimeout(track(sid, crawer), 5000);
        }
    };
    track(submission, crawers[oj]);
};
