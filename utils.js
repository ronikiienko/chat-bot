const getSubstringAfterOccurrence = (string, occurenceToFind) => {
    const regexPattern = `${occurenceToFind}(.*)`;
    const regex = new RegExp(regexPattern, 's');
    const result = string.split(regex);
    return result.length === 1 ? result[0] : result[1];
};

module.exports = {getSubstringAfterOccurrence};