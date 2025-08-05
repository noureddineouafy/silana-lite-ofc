// plugin by noureddine ouafy
// scrape by wolfyflutter


import fetch from 'node-fetch';

/**
 * Shortens a URL using the n9.cl service.
 * @param {string} longUrl The original URL to shorten.
 * @returns {Promise<string>} The shortened URL.
 */
async function shortenUrl(longUrl) {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    // The API requires the URL to be wrapped in this specific CDATA format.
    const body = new URLSearchParams({
        'xjxfun': 'create',
        'xjxargs[]': `S<![CDATA[${longUrl}]]>`
    });

    try {
        const response = await fetch('https://n9.cl/en', {
            method: 'POST',
            headers: headers,
            body: body
        });

        if (!response.ok) {
            throw new Error(`API request failed with status: ${response.status} ${response.statusText}`);
        }

        const responseText = await response.text();
        
        // The result is returned in a JavaScript location assignment within the HTML response.
        const match = responseText.match(/location = "(.+?)";/);
        const resultUrl = match?.[1];

        if (!resultUrl) {
            throw new Error('Failed to extract the shortened URL from the API response.');
        }

        // Clean up the URL to get the final short link.
        const finalUrl = resultUrl.replace('/en/r', '');
        return finalUrl;

    } catch (error) {
        // Re-throw the error to be caught by the handler.
        throw error;
    }
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        return m.reply(`Please provide a URL to shorten.\n\n*Example:*\n${usedPrefix + command} https://github.com/features`);
    }

    // A simple regex to validate if the input is a URL.
    const urlRegex = /^(https?:\/\/[^\s/$.?#].[^\s]*)$/i;
    if (!urlRegex.test(text)) {
        return m.reply('The text provided does not look like a valid URL.');
    }

    try {
        await m.reply('⏳ Shortening your URL, please wait...');
        
        const shortLink = await shortenUrl(text);
        
        await m.reply(
            `✅ URL shortened successfully!\n\n` +
            `*Original:* ${text}\n` +
            `*Shortened:* ${shortLink}`
        );

    } catch (error) {
        console.error('URL Shortener Error:', error);
        m.reply(`An error occurred: ${error.message}`);
    }
};

handler.help = ['n9cl'];
handler.command = ['n9cl'];
handler.tags = ['tools'];
handler.limit = true;

export default handler;
