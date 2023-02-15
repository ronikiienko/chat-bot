const defaultCompletionConfigs = {
    temperature: 0.5,
    maxTokens: 100,
    model: 'text-davinci-003',
};

const defaultImageConfigs = {
    size: '1024x1024',
    n: 1,
    responseFormat: 'url',
};

const defaultBotConfigs = {
    maxTokens: 100,
};

const helpText = `I can answer any of your questions on various topics or draw anything' +
    '\n\nFor example you can ask me to tell you a story about Mighty Mouser. ' +
    '\n\nYou can also ask me to draw anything if start your message with \'draw\', followed by what you want me to draw. For example: draw mouse ' +
    '\n\n\nThere are also some settings, which are: ' +
    '\n\nModel - Set AI model. Davinci is smartest, but slowest. Ada is fastest but STUPID. Still, less advanced ones can perform some tasks quite well. ' +
    '\n\nTemperature - The more the temperature - the more risky and chaotic answers are ' +
    '\n\nPicture size - Resolution of pictures i draw. Lower resolutions are being drawn faster.' +
    '\n\n\nI\'m using OpenAI APIs. KEEP IN MIND, THAT I CAN\'T KEEP CONTEXT OF CONVERSATION. I CAN ONLY ANSWER YOUR QUESTIONS. It is best to ask in English.`;

const adminHelpText = 'Commands:\n#maxTokens `max number of tokens';

const noPermissionText = 'You do not have permission to do that';

module.exports = {
    defaultCompletionConfigs,
    defaultImageConfigs,
    defaultBotConfigs,
    helpText,
    adminHelpText,
    noPermissionText,
};

// markdown:
// **text** is bald
// `text` is monospace(code)
// ```text``` also code (but somehow different)
// __text__ is italic
// ~~text~~ is strikethrough

// TODO when press on keyboard it goes also to message and bot answers