/**
 * Prompt Enhancer Handler (ESM Version)
 * This file adapts the prompt enhancement script into a command handler.
 *
 * Command: .enhance
 * Usage: .enhance [type] <prompt>
 * Example: .enhance a beautiful landscape
 * Example with type: .enhance mid a futuristic city with flying cars
 *
 * Dependencies: axios, crypto
 * plugin by noureddine ouafy 
 * scrape by GilangSan
 */

import axios from 'axios';
import crypto from 'crypto';

// --- Helper Functions from the original script ---

const KEY = "kR9p2sL7mZ3xA1bC5vN8qE4dF6gH2jK3";
const IV = "a1B2c3D4e5F6g7H8";

/**
 * Decrypts the encrypted data received from the API.
 * @param {string} encryptedBase64 The base64 encoded encrypted string.
 * @returns {object|string} The decrypted data, parsed as JSON if possible.
 */
function decryptData(encryptedBase64) {
    try {
        const keyBuffer = Buffer.from(KEY).slice(0, 32);
        const ivBuffer = Buffer.from(IV).slice(0, 16);
        const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);
        let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        try {
            // Try to parse the result as JSON
            return JSON.parse(decrypted);
        } catch {
            // Return as plain text if not JSON
            return decrypted;
        }
    } catch (err) {
        console.error('Decryption error:', err);
        throw new Error('Failed to decrypt data');
    }
}

/**
 * Fetches an authentication token from the API.
 * @returns {Promise<object|Error>} An object containing the token and cookies, or an Error.
 */
async function getToken() {
    try {
        const res = await axios.get('https://prompthancer.com/api/token', {
            headers: {
                "Content-Type": "application/json",
                "Referer": "https://prompthancer.com/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
            }
        });

        return {
            data: res.data,
            cookie: res.headers['set-cookie'] ? res.headers['set-cookie'].map(cookie => cookie.split(';')[0]).join('; ') : ''
        };
    } catch (e) {
        console.error("Error fetching token:", e);
        return e;
    }
}

/**
 * Calls the API to enhance a given prompt.
 * @param {string} prompt The original prompt to enhance.
 * @param {string} [type='basic'] The type of enhancement ('basic' or 'mid').
 * @returns {Promise<object|string>} The API response or an error message string.
 */
async function promptEnhancer(prompt, type = 'basic') {
    if (!prompt) return 'Where is the prompt?';
    try {
        const endpoint = type === 'basic' ? 'https://prompthancer.com/api/enhancebasic' : 'https://prompthancer.com/api/enhancemid';
        const tokenResponse = await getToken();

        if (tokenResponse instanceof Error) {
            return `Error fetching token: ${tokenResponse.message}`;
        }

        const { data } = await axios.post(endpoint, {
            "originalPrompt": prompt,
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenResponse.data.token}`,
                'Cookie': tokenResponse.cookie,
                'Origin': 'https://prompthancer.com',
                'Referer': 'https://prompthancer.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
            }
        });
        return data;
    } catch (e) {
        console.error("Prompt Enhancer API Error:", e);
        return e;
    }
}


// --- The Command Handler ---

const handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        let helpMessage = `*Please provide a prompt to enhance.*\n\n`;
        helpMessage += `*Usage Example:*\n`;
        helpMessage += `${usedPrefix + command} a photorealistic cat wearing a wizard hat\n\n`;
        helpMessage += `*You can also specify an enhancement type:*\n`;
        helpMessage += `(basic, mid)\n`;
        helpMessage += `${usedPrefix + command} mid a logo for a coffee shop`;
        return conn.reply(m.chat, helpMessage, m);
    }

    // Default enhancement type
    let type = 'basic';
    let prompt = text;

    // Check if the user is specifying a type
    const availableTypes = ['basic', 'mid'];
    const firstWord = text.split(' ')[0].toLowerCase();

    if (availableTypes.includes(firstWord)) {
        type = firstWord;
        prompt = text.substring(firstWord.length).trim();

        if (!prompt) {
            return conn.reply(m.chat, `Please provide a prompt after specifying the type '${type}'.`, m);
        }
    }

    try {
        await conn.reply(m.chat, `*Enhancing your prompt with the '${type}' model...*\n\nPlease wait, this may take a moment.`, m);

        const result = await promptEnhancer(prompt, type);

        // Check for errors or invalid responses from the enhancer function
        if (typeof result === 'string' || (result instanceof Error)) {
             throw new Error(result.message || result);
        }

        if (result && result.data) {
            const decryptedResult = decryptData(result.data);
            
            // Format the output nicely
            const finalPrompt = decryptedResult.enhancedPrompt || "No enhanced prompt found in the result.";
            await conn.reply(m.chat, `*✨ Enhanced Prompt ✨*\n\n${finalPrompt}`, m);

        } else {
            console.error("Unexpected API Response:", result);
            throw new Error('Failed to enhance prompt. The API returned an invalid response.');
        }

    } catch (e) {
        console.error("Handler Error:", e);
        await conn.reply(m.chat, `An error occurred: ${e.message}`, m);
    }
};

// Handler configuration
handler.help = ['promptenhance'];
handler.tags = ['ai'];
handler.command = ['promptenhance'];
handler.limit = true;

export default handler;
