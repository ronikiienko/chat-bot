const {Configuration, OpenAIApi} = require('openai');
const {defaultCompletionConfigs, defaultImageConfigs} = require('./consts');
require('dotenv').config();

console.log('Bot is on!');

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);


/**
 *
 * @param prompt {string}
 * @param configs {object}
 * @param {'text-davinci-003'|'text-curie-001'|'text-babbage-001'|'text-ada-001'} [configs.model]
 * @param {number} [configs.temperature] - Number from 0 to 1
 * @param {number} [configs.maxTokens] - How many tokens can answer be in length. For English text, 1 token is approximately 4 characters or 0.75 words.
 * @return {Promise<string>}
 */
const generateAnswer = async (prompt, configs = defaultCompletionConfigs) => {
    if (!prompt) return 'could not get answer';
    try {
        const completion = await openai.createCompletion({
            model: configs.model,
            prompt: prompt.trim(),
            temperature: configs.temperature,
            max_tokens: configs.maxTokens,
        });
        return completion.data.choices[0].text;
    } catch (e) {
        if (e.response.status === 429) return 'Error: Wait a bit. Too many requests from users';
        console.log('errrrrrror:(', e.message, e.response.status);
        return 'Error: Could not get answer';
    }
};

const generatePicture = async (prompt, configs = defaultImageConfigs) => {
    if (!prompt) return 'could not get answer';
    try {
        const response = await openai.createImage({
            prompt: prompt.trim(),
            size: configs.size,
            response_format: configs.responseFormat,
            n: configs.n,
        });
        return response.data.data[0].url;
    } catch (e) {
        if (e.response.status === 429) return 'Error: Wait a bit. Too many requests from users';
        console.log('errrrrrror:(', e.message, e.response.status, e);
        return undefined;
    }
};


module.exports = {generateAnswer, generatePicture};