const path = require('path');
const Datastore = require('nedb-promises');
const {Telegraf, Markup} = require('telegraf');
const {generateAnswer} = require('./generator');
const {defaultGeneratorConfigs} = require('./consts');

let usersDb = Datastore.create(path.join('users.db'));
let configsDb = Datastore.create(path.join('configs.db'));

const bot = new Telegraf(process.env.BOT_TOKEN);

const userKeyboard = Markup.keyboard([
    ['Settings  ⚙️'],
    ['See current settings  👁️'],
    ['Help  ❓'],
]).oneTime().resize();

const adminKeyboard = Markup.keyboard([
    ['Settings  ⚙️'],
    ['See current settings  👁️'],
    ['Help  ❓'],
    ['Admin features  🛠️'],
]).oneTime().resize();

const inlineSettingsKeyboard = [[
    {text: 'Set AI model', callback_data: 'set_ai_model'},
    {text: 'Set temperature', callback_data: 'set_temperature'},
]];

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

bot.command('start', async (ctx) => {
    const user = await handleUser(ctx);
    if (!user) return ctx.sendMessage('Something went wrong');
    const keyboard = user.isAdmin ? adminKeyboard : userKeyboard;
    ctx.reply('Ask me any questions!', keyboard);
});

bot.hears('Help  ❓', (ctx) => {
    ctx.sendMessage('I can answer your questions, or maintain dialog, but mainly answer questions. For example you can ask me to tell you a story about Mighty Mouser. The more temperature value is - the more risky my answers are. \n\n I\'m using OpenAI text completion API. ');
});

bot.hears('Settings  ⚙️', (ctx) => {
    ctx.reply('Settings:', {reply_markup: JSON.stringify({inline_keyboard: inlineSettingsKeyboard})});
});

bot.hears('See current settings  👁️', async (ctx) => {
    const user = await handleUser(ctx);
    ctx.sendMessage(`Temperature 🌡️ : ${user.temperature}\nModel 🧍: ${user.model}`);
});

bot.on('message', async (ctx) => {
    const messageText = ctx.message.text;

    const user = await handleUser(ctx);
    if (!user) return ctx.sendMessage('Something went wrong');
    const needToAnswer = await handleAdmin(ctx);
    if (!needToAnswer) return;

    const answer = await generateAnswer(messageText, {
        model: user?.model,
        temperature: user?.temperature,
        maxTokens: defaultGeneratorConfigs.maxTokens,
    });
    if (answer) ctx.sendMessage(answer);
});

bot.launch();

