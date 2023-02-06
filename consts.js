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

module.exports = {defaultCompletionConfigs, defaultImageConfigs};