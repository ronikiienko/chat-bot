const {Telegraf} = require('telegraf');
const {generateAnswer, generatePicture} = require('./generator');
const {
    defaultCompletionConfigs,
    defaultImageConfigs,
    helpText,
    adminHelpText,
    noPermissionText,
} = require('./consts');
const {getSubstringAfterOccurrence} = require('./utils');
const {
    adminKeyboard, userKeyboard, inlinePictureSizeSettingsKeyboard, inlineTemperatureSettingsKeyboard,
    inlineModelSettingsKeyboard, inlineSettingsKeyboard, inlineAdminFeaturesKeyboard,
} = require('./markup');
const {usersDb, configsDb, usersDbPath, configsDbPath} = require('./db');
const {logFilePath, createLog} = require('./logs');
const {spoiler, strikethrough} = require('telegraf/format');


const bot = new Telegraf(process.env.BOT_TOKEN);

createLog('Script started');
const handleUser = async (from) => {
    const existingUser = await usersDb.findOne({userId: from.id});
    if (existingUser) {
        return existingUser;
    } else {
        createLog(`Creating new user:\nFirst name: ${from.first_name},\nLast name: ${from.last_name},\nUsername: ${from.username}`);
        return await usersDb.insertOne({
            isAdmin: false,
            userId: from.id,
            firstName: from.first_name,
            lastName: from.last_name,
            username: from.username,
            temperature: defaultCompletionConfigs.temperature,
            model: defaultCompletionConfigs.model,
            pictureSize: defaultImageConfigs.size,
            timeAdded: Date.now(),
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
            await ctx.sendMessage(`You are admin now!\n${adminHelpText}`);
            ctx.reply('Ask me any questions!', adminKeyboard);
            createLog(`User ${user.firstName} is now admin`);
            return true;
        }
    } else {
        return false;
    }
};

const handleSpecialCommands = async (ctx, user) => {
    const messageText = ctx.message.text;
    if (messageText?.startsWith('#maxTokens')) {
        if (!user.isAdmin) return ctx.sendMessage(noPermissionText);
        let newMaxTokens = Number(getSubstringAfterOccurrence(messageText, '#maxTokens '));
        if (!newMaxTokens) return ctx.sendMessage('Wrong format. Type: #maxTokens `numberOfMaxTokens`');
        if (newMaxTokens < 2 || newMaxTokens > 5000) return ctx.sendMessage('Invalid number of max tokens. THINK AGAIN');
        const configs = await configsDb.findOne({});
        await configsDb.update({_id: configs._id}, {$set: {maxTokens: newMaxTokens}});
        createLog(`Number of maxTokens was updated by user ${user.firstName}. New value: ${newMaxTokens}`);
        return ctx.sendMessage('Updated. yOU are VERY smart');
    }
};

bot.command('start', async (ctx) => {
    const user = await handleUser(ctx.message.from);
    if (!user) return ctx.sendMessage('Something went wrong');
    const keyboard = user.isAdmin ? adminKeyboard : userKeyboard;
    ctx.reply(helpText, keyboard);
});

bot.action(async (value, ctx) => {
    const user = await handleUser(ctx.update.callback_query.from);
    if (value === 'set-temperature') {
        await ctx.reply('Set temperature. The more the temperature - the more risky and chaotic answers are', {reply_markup: JSON.stringify({inline_keyboard: inlineTemperatureSettingsKeyboard})});
    }
    if (value === 'set-model') {
        await ctx.reply('Set AI model. Davinci is most advanced, but the slowest. Ada is the fastest but least advanced. But still, less advanced ones can perform some tasks well.', {reply_markup: JSON.stringify({inline_keyboard: inlineModelSettingsKeyboard})});
    }
    if (value === 'set-picture-size') {
        await ctx.reply('Set picture size. Lower resolutions are being drawn faster.', {reply_markup: JSON.stringify({inline_keyboard: inlinePictureSizeSettingsKeyboard})});
    }
    if (value.startsWith('temperature')) {
        const newTemperature = Number(getSubstringAfterOccurrence(value, 'temperature-'));
        await usersDb.update({userId: user.userId}, {$set: {temperature: newTemperature}});
        return ctx.sendMessage('Temperature updated');
    }
    if (value.startsWith('model')) {
        const newModel = getSubstringAfterOccurrence(value, 'model-');
        await usersDb.update({userId: user.userId}, {$set: {model: newModel}});
        return ctx.sendMessage('Model updated');
    }
    if (value.startsWith('picture-size-')) {
        const newSize = getSubstringAfterOccurrence(value, 'picture-size-');
        await usersDb.update({userId: user.userId}, {$set: {pictureSize: newSize}});
        return ctx.sendMessage('Picture size updated');
    }
    if (value.startsWith('admin')) {
        if (!user.isAdmin) return ctx.sendMessage(noPermissionText);
        if (value === 'admin-see-all-users') {
            const users = await usersDb.find({});
            for (const user of users) {
                await ctx.sendDocument({source: usersDbPath});
            }
        }
        if (value === 'admin-see-configs') {
            await ctx.sendDocument({source: configsDbPath});
        }
        if (value === 'admin-help') {
            await ctx.sendMessage(adminHelpText);
        }
        if (value === 'admin-see-logs') {
            await ctx.sendDocument({source: logFilePath});
        }
    }
});

// bot.hears(async (value, ctx) => {
//     const user = await handleUser(ctx.message.from);
//     switch (value) {
//         case 'Help  ❓': {
//             await ctx.sendMessage(strikethrough(helpText), {parse_mode: 'MarkdownV2'})
//         }
//         break;
//         case 'Settings  ⚙️': {
//             await ctx.reply('Settings:', {reply_markup: JSON.stringify({inline_keyboard: inlineSettingsKeyboard})});
//         }
//         break;
//         case 'See current settings  👁️': {
//             await ctx.sendMessage(`Temperature 🌡️ : ${user.temperature}\nModel 🧍: ${user.model}\nPicture size 📷: ${user.pictureSize}`);
//         }
//         break;
//         case 'Admin features  🛠️': {
//             if (user.isAdmin) {
//                 await ctx.reply('Admin features:', {reply_markup: JSON.stringify({inline_keyboard: inlineAdminFeaturesKeyboard})});
//             } else {
//                 await ctx.sendMessage(noPermissionText);
//             }
//         }
//     }
// })

bot.hears('Help  ❓', async (ctx) => {
    await ctx.sendMessage(helpText);
});
bot.hears('Settings  ⚙️', async (ctx) => {
    await ctx.reply('Settings:', {reply_markup: JSON.stringify({inline_keyboard: inlineSettingsKeyboard})});
});
bot.hears('See current settings  👁️', async (ctx) => {
    const user = await handleUser(ctx.message.from);
    await ctx.sendMessage(`Temperature 🌡️ : ${user.temperature}\nModel 🧍: ${user.model}\nPicture size 📷: ${user.pictureSize}`);
});
bot.hears('Admin features  🛠️', async (ctx) => {
    const user = await handleUser(ctx.message.from);
    if (user.isAdmin) {
        await ctx.reply('Admin features:', {reply_markup: JSON.stringify({inline_keyboard: inlineAdminFeaturesKeyboard})});
    } else {
        await ctx.sendMessage(noPermissionText);
    }
});

bot.on('message', async (ctx) => {
    try {
        const messageText = ctx.message.text;
        if (!messageText) return;

        const user = await handleUser(ctx.message.from);

        createLog(`User ${user.firstName} send message:\n${messageText.replace('/\\s\\s+/g', ' ')}`);

        const configs = await configsDb.findOne({});

        if (await handleAdmin(ctx, user)) return;
        if (await handleSpecialCommands(ctx, user)) return;

        if (messageText.toLowerCase().startsWith('draw')) {
            ctx.sendChatAction('upload_photo');
            const drawPrompt = getSubstringAfterOccurrence(messageText.toLowerCase(), 'draw');
            const picture = await generatePicture(drawPrompt, {...defaultImageConfigs, size: user?.pictureSize});

            if (Array.isArray(picture) || !picture) {
                createLog(`Bot responsed rudely. User ${user.firstName} requested very bad word`);
                return ctx.sendMessage(picture?.[0] || 'SOMTIN HORIBLO WRONGA');
            }
            if (picture) {
                createLog(`Bot sent picture to user ${user.firstName}`);
                return ctx.sendPhoto(picture);
            }
        } else {
            ctx.sendChatAction('typing');
            const answer = await generateAnswer(messageText, {
                ...defaultCompletionConfigs,
                model: user?.model,
                temperature: user?.temperature,
                maxTokens: configs.maxTokens,
            });
            createLog(`Bot answer to user ${user.firstName}:${answer.replace('\n', ' ')}`);
            if (answer) ctx.sendMessage(answer);
        }
    } catch (e) {
        createLog(`ERROR ERROR ERROR: Error in message handler:\n${e.message}`);
        ctx.sendMessage('Something went horribly wrong');
    }

});

bot.catch((err) => {
    createLog(`ERROR ERROR ERROR: Bot.catch catched error\n${err.message}`);
});

bot.launch();
