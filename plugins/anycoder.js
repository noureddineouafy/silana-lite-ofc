// plugin by noureddine ouafy 
// scrape by rynn-stuff

import axios from 'axios';

/**
 * Generates code using the AnyCoder API.
 * @param {string} prompt The prompt for the code generation.
 * @param {object} [options] Options for the API call.
 * @param {boolean} [options.use_search=false] Whether to use web search.
 * @param {string} [options.language='html'] The programming language.
 * @returns {Promise<string>} The generated code.
 */
async function anycoder(prompt, { use_search = false, language = 'html' } = {}) {
    try {
        const supported_langs = ['html', 'python', 'c', 'cpp', 'markdown', 'latex', 'json', 'css', 'javascript', 'jinja2', 'typescript', 'yaml', 'dockerfile', 'shell', 'r', 'sql', 'sql-msSQL', 'sql-mySQL', 'sql-mariaDB', 'sql-sqlite', 'sql-cassandra', 'sql-plSQL', 'sql-hive', 'sql-pgSQL', 'sql-gql', 'sql-gpSQL', 'sql-sparkSQL', 'sql-esper', 'transformers.js'];
        if (!supported_langs.includes(language)) {
            throw new Error(`Language '${language}' is not supported.`);
        }

        const session_hash = Math.random().toString(36).substring(2);
        
        // --- Join the processing queue ---
        await axios.post(`https://akhaliq-anycoder.hf.space/gradio_api/queue/join?`, {
            data: [prompt, null, null, null, null, null, null, use_search, language, null],
            event_data: null,
            fn_index: 7,
            trigger_id: 14,
            session_hash: session_hash
        });

        // --- Poll for the result ---
        const maxAttempts = 30; // Max 30 attempts (e.g., 30 seconds)
        let attempt = 0;
        
        while (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between polls
            const { data } = await axios.get(`https://akhaliq-anycoder.hf.space/gradio_api/queue/data?session_hash=${session_hash}`);
            const lines = data.split('\n\n').filter(line => line.startsWith('data:'));
            
            for (const line of lines) {
                const eventData = JSON.parse(line.substring(6));
                if (eventData.msg === 'process_completed') {
                    // Return the generated code, which is the first element in the data array
                    return eventData.output.data[0];
                }
            }
            attempt++;
        }

        throw new Error('Request timed out. The server is taking too long to respond.');

    } catch (error) {
        // Re-throw a cleaner error message
        throw new Error(error.response ? error.response.data.detail || error.message : error.message);
    }
}

// --- Handler Definition ---
let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        return m.reply(`Please provide a text prompt to generate code. 🤖\n\n*Example:*\n${usedPrefix + command} create a responsive navbar with a logo on the left and links on the right using HTML and Tailwind CSS.`);
    }

    try {
        await m.reply('⏳ **Generating code...** Please wait, this might take a moment.');

        const result = await anycoder(text);
        
        // Format the reply with the prompt and the resulting code
        const replyText = `*PROMPT:*\n\`\`\`${text}\`\`\`\n\n*GENERATED CODE:*\n\`\`\`\n${result}\n\`\`\``;
        await m.reply(replyText);

    } catch (e) {
        console.error(e);
        await m.reply(`An error occurred while processing your request. Please try again.\n\n*Error:* ${e.message}`);
    }
};

handler.help = ['anycoder'];
handler.tags = ['ai'];
handler.command = ['anycoder'];
handler.limit = true;

export default handler;
