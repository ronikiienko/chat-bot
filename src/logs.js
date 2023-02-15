const path = require('path');
const fs = require('fs-extra');


const logFilePath = path.join('data', 'logs.txt');
fs.ensureFile(logFilePath);

const createLog = (logText) => {
    console.log(logText);
    fs.appendFile(logFilePath, `\n${new Date().toGMTString()}\n${logText}\n`);
};

module.exports = {createLog, logFilePath};

