/**
 * Plugin by noureddine ouafy 
 * Summarizer Youtube AI by lang
 * package: axios
 * official channel: https://www.whatsapp.com/channel/0029VafnytH2kNFsEp5R8Q3n
 */

import axios from 'axios';

const headers = {
    'Content-Type': 'application/json',
    Origin: 'https://tubeonai.com',
    Referer: 'https://tubeonai.com/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
};

// Helper function to join chunks from the API response
function joinChunksFromString(raw) {
    return raw
        .split("\n")
        .map(line => line.trim())
        .filter(line => /^\d+:/.test(line))
        .map(line => {
            const match = line.match(/^\d+:"?(.*?)"?$/);
            return match ? match[1] : "";
        })
        .join("");
}

// Function to summarize YouTube video
async function summarize(url, detail = 'Detailed', tone = 'Neutral', language = 'en-US') {
    if (!url) throw new Error('URL is required');
    try {
        const { data } = await axios.post('https://web.tubeonai.com/api/public/summarize', {
            tool_name: "web-page-summarizer",
            url,
            detail_level: detail,
            tone,
            language,
            user_id: "newsletter_14155",
            link_or_id: url
        }, { headers });

        const { data: summary } = await axios.post('https://web.tubeonai.com/api/public/generate-summary', {
            summary_id: data.data.id,
            transcript: data.data.transcript,
            detail_level: detail,
            tone_name: tone,
            language,
            user_id: "newsletter_14155",
            prompt: ""
        }, { headers });

        return {
            title: data.data.title,
            summary: joinChunksFromString(summary),
            transcript: data.data.transcript
        };
    } catch (e) {
        return { error: e.message };
    }
}

// WhatsApp bot handler
let handler = async (m, { conn, text }) => {
    if (!text) return m.reply('Please provide a YouTube URL.\nUsage: .tubeonai <link>');

    try {
        const result = await summarize(text, 'Comprehensive', 'Neutral', 'id-ID');
        if (result.error) return m.reply(`Error: ${result.error}`);

        let message = `*Title:* ${result.title}\n\n*Summary:*\n${result.summary}`;
        conn.reply(m.chat, message, m);
    } catch (err) {
        m.reply('Failed to summarize the video. Please try again later.');
        console.error(err);
    }
};

handler.help = handler.command = ['tubeonai'];
handler.tags = ['tools'];
handler.limit = true;

export default handler;
