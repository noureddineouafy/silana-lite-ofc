// Helper function to interact with the ungu.in API
async function unguShort(url, shorten) {
    // Defines the API endpoint
    const endpoint = 'https://api.ungu.in/api/v1/links/for-guest';

    try {
        // Sends a POST request to the API with the URL to shorten
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // The body contains the original URL and an optional custom alias
            body: JSON.stringify({
                original: url,
                shorten: shorten
            })
        });

        // Parses the JSON response from the server
        let data = await response.json();

        // If the API returns an error message, forward it to the user
        if (data.message) {
            return { error: data.message };
        }
        
        // The API includes the user's IP in the response; we delete it for privacy.
        delete data?.data?.ip;
        
        // Returns the successful response data, prefixing the shortened path with the full domain
        return {
            ...data?.data,
            shorten: 'https://ungu.in/' + data?.data?.shorten
        };

    } catch (e) {
        // Catches any network or unexpected errors during the fetch process
        console.error(e);
        return { error: 'An error occurred while contacting the shortening service.' };
    }
}

// Main handler for the bot command
let handler = async (m, { conn, text, usedPrefix, command }) => {
    // Splits the user's message into parts to get the URL and optional custom alias
    let [url, customAlias] = text.split(' ');

    // Checks if a URL was provided. If not, sends usage instructions.
    if (!url) {
        return m.reply(`*Usage:* ${usedPrefix + command} <url> [custom_alias]\n\n*Example:* ${usedPrefix + command} https://google.com my-google`);
    }

    // Basic validation to check if the input looks like a URL
    if (!/^(https?:\/\/)?([\w\d.-]+)\.([\w\d.]{2,6})([/\w\d.-]*)*\/?$/.test(url)) {
        return m.reply('Please provide a valid URL.');
    }

    await m.reply('🔗 Shortening your link, please wait...');

    // Calls the helper function with the provided URL and alias
    const result = await unguShort(url, customAlias);

    // If the result contains an error, reply with the error message
    if (result.error) {
        return m.reply(`*Error:* ${result.error}`);
    }

    // If successful, format and send the result back to the user
    let replyText = `✅ *Link Shortened Successfully!*\n\n`;
    replyText += `*Original:* ${result.original}\n`;
    replyText += `*Shortened:* ${result.shorten}`;

    m.reply(replyText);
};

// --- Handler Configuration ---
handler.help = ['shorturl-ungu']; // Help text for the menu
handler.tags = ['tools'];                         // Category for the command
handler.command = ['shorturl-ungu'];  // Aliases to trigger the command
handler.limit = true;                             // Enables usage limit for this command

export default handler;
