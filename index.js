const path = require('path');
const Datastore = require('nedb-promises');
const {Telegraf} = require('telegraf');
const {generateAnswer} = require('./generator');

const bot = new Telegraf(process.env.BOT_TOKEN);


let datastore = Datastore.create(path.join('db.db'));

datastore.insert({bru: 'lol'})
    .catch(console.log);