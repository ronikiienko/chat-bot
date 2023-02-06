const path = require('path');
const Datastore = require('nedb-promises');
const {Telegraf} = require('telegraf');
const {generateAnswer} = require('./generator');
const {defaultGeneratorConfigs} = require('./consts');

let usersDb = Datastore.create(path.join('users.db'));
let configsDb = Datastore.create(path.join('configs.db'));

const bot = new Telegraf(process.env.BOT_TOKEN);

const handleUser = async (from, messageText) => {
    const isPassword = messageText === process.env.ADMIN_PASSWORD;
    const existingUser = await usersDb.findOne({userId: from.id});
    if (existingUser) {
        isPassword && await usersDb.updateOne({userId: from.id}, {isAdmin: isPassword});
        return existingUser;
    } else {
        return await usersDb.insertOne({
            isAdmin: isPassword,
            userId: from.id,
            username: from.first_name,
            temperature: defaultGeneratorConfigs.temperature,
            model: defaultGeneratorConfigs.model,
        });
    }
};

bot.on('message', async (ctx) => {
    const messageText = ctx.message.text;

    const user = await handleUser(ctx.message.from, messageText);
    console.log(user);

    const answer = await generateAnswer(messageText, {model: user?.model, temperature: user?.temperature});
    if (answer) ctx.sendMessage(answer);
});

bot.launch();

