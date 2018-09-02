import { get } from "./http";
import { IProblemModel } from "./interfaces";

export const getProblem = async (problemID: string): Promise<IProblemModel> => {
    return (await get(`/api/problem/${problemID}`, {})) as IProblemModel;
};
