const http = require("./http");

exports.getSolution = async (solutionID) => {
    return await http.get(`/api/solution/${solutionID}`, {});
};

exports.updateSolution = async (solution) => {
    await http.post(`/api/solution/${solution._id}`, {}, solution);
};
