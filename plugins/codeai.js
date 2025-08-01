/**
 * plugin by noureddine ouafy
 * scrape by GilangSan
 * CodeAI - AI Code Generator Handler (ESM Version)
 * This file integrates the codeAI function into a command handler using ES Modules.
 *
 * Command: .codeai
 * Usage: .codeai [model] <prompt>
 * Example: .codeai create a discord bot with javascript
 * Example with model: .codeai claude-3-5-sonnet create a python flask server
 *
 * Dependencies: axios
 */

import axios from 'axios';

/**
 * Calls the CodeAI API to generate code from a prompt.
 * @param {string} prompt The user's request for code generation.
 * @param {string} [model='gpt-4o'] The AI model to use. Options: 'gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet'.
 * @returns {Promise<object|Error>} The API response containing the generated code or an error object.
 */
async function codeAI(prompt, model = 'gpt-4o') {
    if (!prompt) return { error: 'Prompt is missing.' };
    try {
        const { data } = await axios.post('https://ai-code-generator-refact2.toolzflow.app/api/chat/public', {
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "code_response",
                    "strict": true,
                    "schema": {
                        "type": "object",
                        "properties": { "code": { "type": "string" } },
                        "required": ["code"],
                        "additionalProperties": false
                    }
                }
            },
            "chatSettings": {
                "model": model,
                "temperature": 0.3,
                "contextLength": 16385,
                "includeProfileContext": false,
                "includeWorkspaceInstructions": false,
                "embeddingsProvider": "openai"
            },
            "messages": [
                {
                    "role": "system",
                    "content": "You are an expert in generating code snippets based on user input. Your task is to create clear and concise code."
                },
                {
                    "role": "user",
                    "content": `${prompt}. Provide only the generated code without explanations.`
                }
            ]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://ai-code-generator-refact2.toolzflow.app',
                'Referer': 'https://ai-code-generator-refact2.toolzflow.app/?__show_banner=false',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
            }
        });
        return data;
    } catch (e) {
        console.error("Error calling CodeAI API:", e);
        return e;
    }
}

// The command handler
const handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        // Provide a more descriptive help message if no prompt is given
        let helpMessage = `*Please provide a prompt to generate code.*\n\n`;
        helpMessage += `*Usage Example:*\n`;
        helpMessage += `${usedPrefix + command} create a responsive navbar with html, css, and javascript\n\n`;
        helpMessage += `*You can also specify a model:*\n`;
        helpMessage += `(gpt-4o, gpt-4o-mini, claude-3-5-sonnet)\n`;
        helpMessage += `${usedPrefix + command} claude-3-5-sonnet write a python script to resize images`;
        return conn.reply(m.chat, helpMessage, m);
    }

    // Default model
    let model = 'gpt-4o';
    let prompt = text;

    // Check if the user is trying to specify a model
    const availableModels = ['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet'];
    const firstWord = text.split(' ')[0].toLowerCase();

    // If the first word is a valid model, use it and adjust the prompt
    if (availableModels.includes(firstWord)) {
        model = firstWord;
        prompt = text.substring(firstWord.length).trim();
        
        // If there's no prompt after the model name, ask for it
        if (!prompt) {
            return conn.reply(m.chat, `Please provide a prompt after specifying the model '${model}'.`, m);
        }
    }

    try {
        // Notify the user that the process has started
        await conn.reply(m.chat, `*Generating code with ${model}...*\n\nPlease wait a moment.`, m);

        const result = await codeAI(prompt, model);

        // Check for a valid code response
        if (result && result.code) {
            // Reply with the generated code
            await conn.reply(m.chat, result.code, m);
        } else {
            // Handle cases where the API response is not as expected
            console.error("Unexpected API Response:", result);
            throw new Error('Failed to generate code. The API returned an invalid response.');
        }

    } catch (e) {
        // Log the error and notify the user
        console.error("Handler Error:", e);
        await conn.reply(m.chat, 'An unexpected error occurred. Please check the logs or try again later.', m);
    }
};

// Handler configuration
handler.help = ['codeai'];
handler.tags = ['tools'];
handler.command = ['codeai']; // You can add aliases here
handler.limit = true; // Apply usage limits if your system has them
export default handler;
