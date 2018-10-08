const http = require("./http");

exports.getProblem = async (problemID) => {
    return (await http.get(`/api/problem/${problemID}`, {}));
};
