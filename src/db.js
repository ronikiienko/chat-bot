const fs = require('fs-extra');
const path = require('path');
const Datastore = require('nedb-promises');
const {defaultBotConfigs} = require('./consts');
const {createLog} = require('./logs');

fs.ensureDir('./data')
    .catch(console.log);
const usersDbPath = path.join('data', 'users.txt');
const configsDbPath = path.join('data', 'configs.txt');
let usersDb = Datastore.create(usersDbPath);
let configsDb = Datastore.create(configsDbPath);

const initializeConfigs = async () => {
    const configs = await configsDb.findOne({});
    if (!configs) {
        await configsDb.insertOne(defaultBotConfigs);
        createLog('Configs db initialized');
    }
};

initializeConfigs()
    .catch(console.log);

module.exports = {usersDb, configsDb, usersDbPath, configsDbPath};