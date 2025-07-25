// plugin by noureddine ouafy 
// scrape by rynn-stuff

import axios from 'axios';

/**
 * This handler takes a snippet of code and uses an external API
 * to generate a plain English explanation of what the code does.
 */
let handler = async (m, { conn, text, usedPrefix, command }) => {
    // Determine the code to be explained.
    // It prioritizes the text from a replied-to (quoted) message,
    // otherwise it uses the text that comes directly after the command.
    const codeToExplain = m.quoted?.text || text;

    // Check if there is any code to explain.
    if (!codeToExplain) {
        throw `Please provide some code to explain.\n\n*Example 1 (direct):*\n${usedPrefix + command} for (let i = 0; i < 5; i++) { console.log(i); }\n\n*Example 2 (reply):*\nReply to a message containing code with the command *${usedPrefix + command}*`;
    }

    try {
        // Inform the user that the explanation is being generated.
        await m.reply('🤔 Analyzing the code... Please wait.');

        // --- Step 1: Call the API with the provided code snippet ---
        const { data } = await axios.post('https://whatdoesthiscodedo.com/api/stream-text', {
            code: codeToExplain // The code snippet from the user
        }, {
            headers: {
                'content-type': 'application/json'
            }
        });
        
        // --- Step 2: Send the explanation back to the user ---
        // The API returns the explanation directly in the response data.
        if (data) {
            // Add a title to the explanation for better formatting.
            const explanation = `💻 *Code Explanation:*\n\n\`\`\`\n${codeToExplain}\n\`\`\`\n\n📝 *Explanation:*\n${data}`;
            await m.reply(explanation);
        } else {
            throw new Error('The API returned an empty response.');
        }

    } catch (error) {
        // Catch and log any errors that occur during the process.
        console.error(error);
        // Inform the user that an error has occurred.
        await m.reply(`Sorry, something went wrong while explaining the code:\n${error.message}`);
    }
};

// --- Handler Configuration ---
// Define how the command should be invoked and categorized.
handler.help = ['explaincode'];
handler.command = /^(whatcode|explaincode)$/i; // Aliases for the command
handler.tags = ['tools'];
handler.limit = true; // Assumes a system to limit usage.
handler.premium = false;

export default handler;

