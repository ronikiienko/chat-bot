const {Markup} = require('telegraf');
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
    {text: 'See logs', callback_data: 'admin-see-logs'},
    {text: 'See configs', callback_data: 'admin-see-configs'},
    {text: 'Admin help', callback_data: 'admin-help'},
]];

module.exports = {
    userKeyboard,
    adminKeyboard,
    inlineSettingsKeyboard,
    inlineModelSettingsKeyboard,
    inlineTemperatureSettingsKeyboard,
    inlinePictureSizeSettingsKeyboard,
    inlineAdminFeaturesKeyboard,
};