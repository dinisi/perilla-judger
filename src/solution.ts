import { ISolution } from "./interfaces";
import { post } from "./http";

export const updateSolution = (id: string, solution: ISolution) => {
    return post("/api/system/solution/update", { id }, solution);
}