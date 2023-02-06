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
    {text: 'Set model', callback_data: 'set-model'},
    {text: 'Set temperature', callback_data: 'set-temperature'},
]];

const inlineModelSettingsKeyboard = [[
    {text: 'Davinci', callback_data: 'model-text-davinci-003'},
    {text: 'Curie', callback_data: 'model-text-curie-001'},
    {text: 'Babbage', callback_data: 'model-text-babbage-001'},
    {text: 'Ada', callback_data: 'model-text-ada-001'},
]];

const inlineTemperatureSettingsKeyboard = [[
    {text: '0', callback_data: 'temperature-0'},
    {text: '0.25', callback_data: 'temperature-0.25'},
    {text: '0.5', callback_data: 'temperature-0.5'},
    {text: '0.75', callback_data: 'temperature-0.75'},
    {text: '1', callback_data: 'temperature-1'},
]];

const handleUser = async (from) => {
    const existingUser = await usersDb.findOne({userId: from.id});
    if (existingUser) {
        return existingUser;
    } else {
        console.log('creating new user');
        return await usersDb.insertOne({
            isAdmin: false,
            userId: from.id,
            name: `${from.first_name}, ${from.last_name}`,
            username: from.username,
            temperature: defaultGeneratorConfigs.temperature,
            model: defaultGeneratorConfigs.model,
        });
    }
};

const handleAdmin = async (from, ctx) => {
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
    const user = await handleUser(ctx.message.from);
    if (!user) return ctx.sendMessage('Something went wrong');
    const keyboard = user.isAdmin ? adminKeyboard : userKeyboard;
    ctx.reply('Ask me any questions!', keyboard);
});

bot.action(async (value, ctx) => {
    const user = await handleUser(ctx.update.callback_query.from);
    if (value === 'set-temperature') {
        ctx.reply('Set temperature. The more the temperature - the more risky and chaotic answers are', {reply_markup: JSON.stringify({inline_keyboard: inlineTemperatureSettingsKeyboard})});
    }
    if (value === 'set-model') {
        ctx.reply('Set AI model. Davinci is most advanced, but the slowest. Ada is the fastest but least advanced. But still, less advanced ones can perform some tasks well.', {reply_markup: JSON.stringify({inline_keyboard: inlineModelSettingsKeyboard})});
    }
    if (value.startsWith('temperature')) {
        const newTemperature = Number(value.split('temperature-')[1]);
        await usersDb.update({userId: user.userId}, {$set: {temperature: newTemperature}});
    }
    if (value.startsWith('model')) {
        const newModel = value.split('model-')[1];
        await usersDb.update({userId: user.userId}, {$set: {model: newModel}});
    }
});

bot.hears('Help  ❓', (ctx) => {
    ctx.sendMessage('I can answer your questions, or maintain dialog, but mainly answer questions. For example you can ask me to tell you a story about Mighty Mouser. The more temperature value is - the more risky my answers are. \n\n I\'m using OpenAI text completion API. ');
});

bot.hears('Settings  ⚙️', (ctx) => {
    ctx.reply('Settings:', {reply_markup: JSON.stringify({inline_keyboard: inlineSettingsKeyboard})});
});

bot.hears('See current settings  👁️', async (ctx) => {
    const user = await handleUser(ctx.message.from);
    ctx.sendMessage(`Temperature 🌡️ : ${user.temperature}\nModel 🧍: ${user.model}`);
});

bot.on('message', async (ctx) => {
    const messageText = ctx.message.text;

    const user = await handleUser(ctx.message.from);
    if (!user) return ctx.sendMessage('Something went wrong');
    const needToAnswer = await handleAdmin(ctx.message.from, ctx);
    if (!needToAnswer) return;

    const answer = await generateAnswer(messageText, {
        model: user?.model,
        temperature: user?.temperature,
        maxTokens: defaultGeneratorConfigs.maxTokens,
    });
    if (answer) ctx.sendMessage(answer);
});

bot.launch();

