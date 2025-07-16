import axios from 'axios';

/**
 * Shorten a URL using lnk.ink API
 * @param {string} originalUrl - The URL to be shortened
 * @param {string} controlMode - Default "full" (or "simple")
 * @returns {Promise<Object>} - The response from lnk.ink (shortUrl, statsUrl, etc.)
 */
async function shortenUrl(originalUrl, controlMode = 'full') {
    try {
        const apiUrl = 'https://lnk.ink/api/links';
        const response = await axios.post(apiUrl, {
            originalUrl,
            controlMode
        }, {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (err) {
        return { error: true, message: err.message, detail: err.response?.data };
    }
}

let handler = async (m, { args, conn }) => {
    // Check if the user provided a URL argument
    if (!args[0]) {
        return m.reply('Please provide a URL to shorten.');
    }

    const originalUrl = args[0];
    const result = await shortenUrl(originalUrl);

    if (result.error) {
        return m.reply(`Error shortening URL: ${result.message}`);
    }

    // Compose a reply message with the shortened URL details
    let replyMessage = `URL Shortened Successfully!
Original URL: ${result.originalUrl}
Short URL: ${result.shortUrl}
Stats URL: ${result.statsUrl}`;

    m.reply(replyMessage);
};

handler.help = handler.command = ['url-short'];
handler.tags = ['tools'];
handler.limit = true;
export default handler;
