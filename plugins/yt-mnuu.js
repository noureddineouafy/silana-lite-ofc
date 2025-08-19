// plugin by noureddine ouafy
// scrape by wolfyflutter


import fetch from 'node-fetch';

/**
 * Fetches the MP3 download link and title from the y2mate.nu API.
 * @param {string} url - The YouTube video URL.
 * @returns {Promise<{status: string, url: string, title: string}>}
 */
const fetchYouTubeAudio = async (url) => {
    // The API endpoint requires a random query parameter to prevent caching.
    const response = await fetch("https://e.mnuu.nu/?_=" + Math.random(), {
        method: "POST",
        body: JSON.stringify({ url }),
        headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    return await response.json();
};

// --- Main Handler ---
const handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        return m.reply(`Please provide a YouTube URL.\n\n*Example:*\n${usedPrefix + command} https://youtu.be/Wp3hvaZ-HDo`);
    }

    // Basic regex to validate YouTube URLs
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    if (!youtubeRegex.test(text)) {
        return m.reply('The provided URL is not a valid YouTube link. Please check it and try again.');
    }

    try {
        // Notify the user that the process has started
        await m.reply('⏳ Searching for audio, please wait...');

        const result = await fetchYouTubeAudio(text);

        if (result.status !== 'ok' || !result.url) {
            throw new Error('Failed to get a valid download link from the API.');
        }

        const audioCaption = `✅ Download Successful!\n\n*Title:* ${result.title}`;

        // Send the audio file to the user
        await conn.sendMessage(m.chat, {
            audio: { url: result.url },
            mimetype: 'audio/mpeg',
            fileName: `${result.title}.mp3`,
            caption: audioCaption
        }, { quoted: m });

    } catch (error) {
        console.error('YouTube MP3 Downloader Error:', error);
        m.reply(`❌ An error occurred while trying to download the audio.\n\n*Error:* ${error.message}`);
    }
};

// --- Handler Configuration ---
handler.help = ['yt-mnuu'];
handler.command = ['yt-mnuu'];
handler.tags = ['downloader'];
handler.limit = true;
handler.premium = false;

export default handler;
