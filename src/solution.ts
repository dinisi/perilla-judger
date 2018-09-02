import { get, post } from "./http";
import { ISolutionModel } from "./interfaces";

export const getSolution = async (solutionID: string): Promise<ISolutionModel> => {
    return (await get(`/api/solution/${solutionID}`, {})) as ISolutionModel;
};

export const updateSolution = async (solution: ISolutionModel) => {
    await post(`/api/solution/${solution._id}`, {}, solution);
};
