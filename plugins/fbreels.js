// plugin by noureddine ouafy 
// scrape by xbladev

import axios from 'axios';

// ─── Core Scraper Function ────────────────────────────────────────────────────
async function fvideodown(fbUrl) {
    const response = await axios.get('https://api.fabdl.com/facebook/get-video', {
        params: { url: fbUrl },
        headers: {
            'accept': 'application/json, text/plain, */*',
            'origin': 'https://fvideodown.com',
            'referer': 'https://fvideodown.com/',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36'
        }
    });
    return response.data;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
let handler = async (m, { conn, text, usedPrefix, command }) => {

    // ── Show guide if no URL is provided ──────────────────────────────────────
    if (!text) {
        const guide = `
╔══════════════════════════════╗
║   📥  Facebook Video Downloader   ║
╚══════════════════════════════╝

*What is this feature?*
This command lets you download Facebook videos and Reels in HD quality directly through the bot.

*How to use:*
> ${usedPrefix}${command} <Facebook Video URL>

*Examples:*
> ${usedPrefix}${command} https://www.facebook.com/reel/1234567890/
> ${usedPrefix}${command} https://fb.watch/xxxxxxxx/
> ${usedPrefix}${command} https://www.facebook.com/watch?v=1234567890

*Supported links:*
✅ Facebook Reels
✅ Facebook Watch videos
✅ Public Facebook video posts
✅ Short fb.watch links

*Notes:*
⚠️ Only *public* videos can be downloaded.
⚠️ Private or restricted videos are not supported.
`.trim();
        return conn.sendMessage(m.chat, { text: guide }, { quoted: m });
    }

    // ── Validate URL ──────────────────────────────────────────────────────────
    const fbRegex = /https?:\/\/(www\.)?(facebook\.com|fb\.watch)\/.+/i;
    if (!fbRegex.test(text.trim())) {
        return conn.sendMessage(m.chat, {
            text: `❌ *Invalid URL!*\n\nPlease provide a valid Facebook video link.\n\n📌 Example:\n> ${usedPrefix}${command} https://www.facebook.com/reel/1234567890/`
        }, { quoted: m });
    }

    // ── Processing notice ─────────────────────────────────────────────────────
    await conn.sendMessage(m.chat, {
        text: '⏳ Fetching your Facebook video, please wait...'
    }, { quoted: m });

    try {
        const data = await fvideodown(text.trim());
        const result = data?.result;

        if (!result) {
            return conn.sendMessage(m.chat, {
                text: '❌ Could not retrieve video info. The video may be private, deleted, or unsupported.'
            }, { quoted: m });
        }

        // Prefer HD, fallback to SD
        const videoUrl = result?.video_hd?.url || result?.video?.url;
        const isHD     = !!result?.video_hd?.url;
        const dur      = result?.duration_ms
            ? `${Math.floor(result.duration_ms / 60000)}m ${Math.floor((result.duration_ms % 60000) / 1000)}s`
            : 'Unknown';

        if (!videoUrl) {
            return conn.sendMessage(m.chat, {
                text: '⚠️ No downloadable link found for this video.'
            }, { quoted: m });
        }

        // ── Send video directly ───────────────────────────────────────────────
        await conn.sendMessage(m.chat, {
            video: { url: videoUrl },
            caption: `${isHD ? '🎬 *HD Quality*' : '📹 *SD Quality*'} | ⏱️ ${dur}`,
            mimetype: 'video/mp4'
        }, { quoted: m });

    } catch (err) {
        console.error('[fbvideo] Error:', err.message);
        await conn.sendMessage(m.chat, {
            text: `❌ *An error occurred.*\n\n> ${err.message}\n\nPlease make sure the video is public and try again.`
        }, { quoted: m });
    }
};

// ─── Handler Metadata ─────────────────────────────────────────────────────────
handler.help    = ['fbreels'];
handler.command = ['fbreels'];
handler.tags    = ['downloader'];
handler.limit   = true;
export default handler;
