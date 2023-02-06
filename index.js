const path = require('path');
const Datastore = require('nedb-promises');
const {Telegraf, Markup} = require('telegraf');
const {generateAnswer} = require('./generator');
const {defaultGeneratorConfigs} = require('./consts');

let usersDb = Datastore.create(path.join('users.db'));
let configsDb = Datastore.create(path.join('configs.db'));

const bot = new Telegraf(process.env.BOT_TOKEN);

const handleUser = async (ctx) => {
    const from = ctx.message.from;
    const existingUser = await usersDb.findOne({userId: from.id});
    if (existingUser) {
        return existingUser;
    } else {
        console.log('creating new user');
        return await usersDb.insertOne({
            isAdmin: false,
            userId: from.id,
            username: from.first_name,
            temperature: defaultGeneratorConfigs.temperature,
            model: defaultGeneratorConfigs.model,
        });
    }
};

const handleAdmin = async (ctx) => {
    const from = ctx.message.from;
    const isPassword = ctx.message.text === process.env.ADMIN_PASSWORD;
    if (isPassword) {
        const existingUser = await usersDb.findOne({userId: from.id});
        if (existingUser.isAdmin) {
            await ctx.sendMessage('You are already admin!');
            return false;
        } else {
            await usersDb.update({userId: from.id}, {$set: {isAdmin: true}});
            await ctx.sendMessage('You are admin now!');
            return false;
        }
    } else {
        return true;
    }
};

bot.on('message', async (ctx) => {
    const messageText = ctx.message.text;

    const user = await handleUser(ctx);
    if (!user) return;
    const needToAnswer = await handleAdmin(ctx);
    if (!needToAnswer) return;

    const answer = await generateAnswer(messageText, {model: user?.model, temperature: user?.temperature});
    if (answer) ctx.sendMessage(answer);
});

bot.launch();

