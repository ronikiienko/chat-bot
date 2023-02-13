const path = require('path');
const Datastore = require('nedb-promises');
const {Telegraf, Markup} = require('telegraf');
const {generateAnswer, generatePicture} = require('./generator');
const {defaultCompletionConfigs, defaultImageConfigs} = require('./consts');
const {getSubstringAfterOccurrence} = require('./utils');

let usersDb = Datastore.create(path.join('users.db'));
let configsDb = Datastore.create(path.join('configs.db'));
usersDb.compactDatafile();
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
    {text: 'Set picture size', callback_data: 'set-picture-size'},
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

const inlinePictureSizeSettingsKeyboard = [[
    {text: '256x256', callback_data: 'picture-size-256x256'},
    {text: '512x512', callback_data: 'picture-size-512x512'},
    {text: '1024x1024', callback_data: 'picture-size-1024x1024'},
]];

const inlineAdminFeaturesKeyboard = [[
    {text: 'See all users', callback_data: 'admin-see-all-users'},
    {text: 'See configs', callback_data: 'admin-see-configs'},
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
            temperature: defaultCompletionConfigs.temperature,
            model: defaultCompletionConfigs.model,
            pictureSize: defaultImageConfigs.size,
        });
    }
};

const handleAdmin = async (ctx, user) => {
    const isPassword = ctx.message.text === process.env.ADMIN_PASSWORD;
    if (isPassword) {
        if (user.isAdmin) {
            await ctx.sendMessage('You are already admin!');
            return true;
        } else {
            await usersDb.update({userId: user.userId}, {$set: {isAdmin: true}});
            await ctx.sendMessage('You are admin now!\nCommands:\n#maxTokens `max number of coins`');
            ctx.reply('Ask me any questions!', adminKeyboard);
            return true;
        }
    } else {
        return false;
    }
};

const handleSpecialCommands = async (ctx, user) => {
    const messageText = ctx.message.text;
    if (!user.isAdmin) return false;
    if (messageText?.startsWith('#maxTokens')) {
        const newMaxTokens = Number(getSubstringAfterOccurrence(messageText, '#maxTokens '));
        if (!newMaxTokens) return ctx.sendMessage('Wrong format. Type: #maxTokens `numberOfMaxTokens`');
        const configs = await configsDb.findOne({});
        if (configs) {
            await configsDb.update({_id: configs._id}, {$set: {maxTokens: newMaxTokens}});
            return ctx.sendMessage('Updated');
        } else {
            await configsDb.insertOne({
                maxTokens: newMaxTokens,
            });
            return ctx.sendMessage('Updated');
        }
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
    if (value === 'set-picture-size') {
        ctx.reply('Set picture size. Lower resolutions are being drawn faster.', {reply_markup: JSON.stringify({inline_keyboard: inlinePictureSizeSettingsKeyboard})});
    }
    if (value.startsWith('temperature')) {
        const newTemperature = Number(getSubstringAfterOccurrence(value, 'temperature-'));
        await usersDb.update({userId: user.userId}, {$set: {temperature: newTemperature}});
    }
    if (value.startsWith('model')) {
        const newModel = getSubstringAfterOccurrence(value, 'model-');
        await usersDb.update({userId: user.userId}, {$set: {model: newModel}});
    }
    if (value.startsWith('picture-size-')) {
        const newSize = getSubstringAfterOccurrence(value, 'picture-size-');
        await usersDb.update({userId: user.userId}, {$set: {pictureSize: newSize}});
    }
    if (!user.isAdmin && value.startsWith('admin')) return;
    if (value === 'admin-see-all-users') {
        const users = await usersDb.find({});
        for (const user of users) {
            ctx.sendMessage(JSON.stringify(user));
        }
    }
    if (value === 'admin-see-configs') {
        const configs = await configsDb.findOne({});
        await ctx.sendMessage(`Max tokens: ${configs.maxTokens}`);
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
    ctx.sendMessage(`Temperature 🌡️ : ${user.temperature}\nModel 🧍: ${user.model}\nPicture size 📷: ${user.pictureSize}`);
});

bot.hears('Admin features  🛠️', async (ctx) => {
    const user = await handleUser(ctx.message.from);
    if (user.isAdmin) {
        ctx.reply('Admin features:', {reply_markup: JSON.stringify({inline_keyboard: inlineAdminFeaturesKeyboard})});
    }
});

bot.on('message', async (ctx) => {
    try {
        const messageText = ctx.message.text;
        if (!messageText) return;

        const user = await handleUser(ctx.message.from);
        const configs = await configsDb.findOne({});

        if (await handleAdmin(ctx, user)) return;
        if (await handleSpecialCommands(ctx, user)) return;

        if (messageText.toLowerCase().startsWith('draw')) {
            ctx.sendChatAction('upload_photo');
            const drawPrompt = getSubstringAfterOccurrence(messageText.toLowerCase(), 'draw');
            const picture = await generatePicture(drawPrompt, {...defaultImageConfigs, size: user?.pictureSize});
            if (picture) return ctx.sendPhoto(picture);
        } else {
            ctx.sendChatAction('typing');
            const answer = await generateAnswer(messageText, {
                model: user?.model,
                temperature: user?.temperature,
                maxTokens: configs.maxTokens,
            });
            if (answer) ctx.sendMessage(answer);
        }
    } catch (e) {
        ctx.sendMessage('Something went horribly wrong');
    }

});

bot.catch((err) => {
    console.log('Ooopsie', err);
});

bot.launch();

// TODO send something to user when error 400 in picture getting (bad words)
