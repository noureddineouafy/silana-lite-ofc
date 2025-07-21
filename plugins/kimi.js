//plugin by noureddine Ouafy 
// scrape by rynn-stuff
import axios from 'axios';

// --- Kimi AI Class ---
// This class handles the interaction with the Kimi AI API.
class Kimi {
    constructor() {
        this.id = String(Date.now()) + Math.floor(Math.random() * 1e3);
        this.headers = {
            'content-type': 'application/json',
            'x-language': 'zh-CN',
            'x-msh-device-id': this.id,
            'x-msh-platform': 'web',
            'x-msh-session-id': String(Date.now()) + Math.floor(Math.random() * 1e3),
            'x-traffic-id': this.id
        };
    }

    register = async function () {
        try {
            const rynn = await axios.post('https://www.kimi.com/api/device/register', {}, {
                headers: this.headers
            });

            return {
                auth: `Bearer ${rynn.data.access_token}`,
                cookie: rynn.headers['set-cookie'].join('; ')
            };
        } catch (error) {
            console.error(error.message);
            return false;
        }
    }

    chat = async function (question, { model = 'k2', search = true, deep_research = false } = {}) {
        try {
            if (!question) throw new Error('Question is required');
            if (!['k1.5', 'k2'].includes(model)) throw new Error(`Available models: k1.5, k2`);

            const reg = await this.register();
            if (!reg) throw new Error('Failed to get authorization token');

            const { data: chat } = await axios.post('https://www.kimi.com/api/chat', {
                name: 'Unnamed Conversation',
                born_from: 'home',
                kimiplus_id: 'kimi',
                is_example: false,
                source: 'web',
                tags: []
            }, {
                headers: {
                    authorization: reg.auth,
                    cookie: reg.cookie,
                    ...this.headers
                }
            });

            const { data } = await axios.post(`https://www.kimi.com/api/chat/${chat.id}/completion/stream`, {
                kimiplus_id: 'kimi',
                extend: { sidebar: true },
                model: model,
                use_search: search,
                messages: [{ role: 'user', content: question }],
                refs: [],
                history: [],
                scene_labels: [],
                use_semantic_memory: false,
                use_deep_research: deep_research
            }, {
                headers: {
                    authorization: reg.auth,
                    cookie: reg.cookie,
                    ...this.headers
                }
            });

            const result = {
                text: '',
                sources: []
            };

            const lines = data.split('\n\n');
            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const d = JSON.parse(line.substring(6));
                    if (d.event === 'cmpl') result.text += d.text;
                    if (d.event === 'search_plus' && d.type === 'get_res') result.sources.push(d.msg);
                }
            }

            return result;
        } catch (error) {
            // Rethrow a cleaner error message
            throw new Error(error.response ? error.response.data.error.message : error.message);
        }
    }
}


// --- Command Handler ---
// This function integrates the Kimi class into a chatbot command.
let handler = async (m, { conn, text, usedPrefix, command }) => {
    // Check if the user provided a query
    if (!text) throw `Please provide a question. \n\n*Example:* \n${usedPrefix + command} What are the latest AI developments?`;

    try {
        // Notify the user that the request is being processed
        await m.reply('🧠 Accessing Kimi AI, please wait...');

        // Create an instance of the Kimi class and get the chat response
        const kimi = new Kimi();
        const response = await kimi.chat(text);

        if (!response || !response.text) {
            throw 'Failed to get a valid response from the API.';
        }

        // Format the final response message
        let replyText = response.text;
        if (response.sources && response.sources.length > 0) {
            replyText += `\n\n--- \n*📚 Sources:*`;
            response.sources.forEach((source, index) => {
                replyText += `\n${index + 1}. *${source.title}*\n   - ${source.url}`;
            });
        }

        // Send the formatted response to the user
        await m.reply(replyText);

    } catch (e) {
        // Log the error and notify the user
        console.error(e);
        await m.reply(`An error occurred: ${e.message}`);
    }
};

// --- Handler Metadata ---
handler.help = ['kimi'];
handler.command = ['kimi', 'kimi-ai'];
handler.tags = ['ai'];
handler.limit = true; // Set to true to apply usage limits if your system has them

export default handler;
