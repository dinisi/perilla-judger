module.exports = function getLanguageInfo(language) {
    return require("./" + language);
};