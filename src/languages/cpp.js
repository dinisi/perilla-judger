module.exports = {
    requireCompile: true,
    sourceFilename: "main.cpp",
    execFilename: "main",
    compilerPath: "/bin/g++",
    parameters: [
        "/bin/g++",
        "main.cpp",
        "-o",
        "main",
        "-Wall",
        "-O2",
        "-std=c++14"
    ]
};
