const path = require('path');
const Datastore = require('nedb-promises');
const {Telegraf} = require('telegraf');
const {generateAnswer} = require('./generator');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.on('message', async (ctx) => {
    const messageText = ctx.message.text;
    const userId = ctx.message.chat.id;

    const answer = await generateAnswer(messageText);
    if (answer) ctx.sendMessage(answer);
});

bot.launch();

let datastore = Datastore.create(path.join('db.db'));

datastore.insert({bru: 'lol'})
    .catch(console.log);