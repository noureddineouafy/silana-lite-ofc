// plugin by noureddine ouafy 
// scrape by manzxy
// thanks to claude ai for helping nour hahaha

import axios from 'axios';
import * as cheerio from 'cheerio';

// ── Page config for each mode ──────────────────────────────────
const PAGE_CONFIG = {
    thumb: {
        page:     'https://imageyoutube.com/thumbnail-download/',
        endpoint: 'https://imageyoutube.com/thumbnail-download/imgyt',
        extra:    { usertimezone: 'Asia/Jakarta', device: 'computer' },
        field:    'v',
    },
    profile: {
        page:     'https://imageyoutube.com/profile-photo-download/',
        endpoint: 'https://imageyoutube.com/profile-photo-download/imgyt',
        extra:    { mcountry: 'en' },
        field:    'v',
    },
    banner: {
        page:     'https://imageyoutube.com/banner-download/',
        endpoint: 'https://imageyoutube.com/banner-download/imgyt',
        extra:    { mcountry: 'en' },
        field:    'v',
    },
    comment: {
        page:     'https://imageyoutube.com/comment-images/',
        endpoint: 'https://imageyoutube.com/comment-images/imgyt',
        extra:    { usertimezone: 'Asia/Jakarta', device: 'computer' },
        field:    'v',
    },
};

async function fetchResult(url, mode) {
    const cfg = PAGE_CONFIG[mode];
    if (!cfg) throw new Error('Invalid mode');

    const pageRes = await axios.get(cfg.page, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 15000,
        maxRedirects: 5,
    });

    const cookie = (pageRes.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');
    const $page  = cheerio.load(pageRes.data);
    const csrf   = $page('input[name=csrf_token]').val() || '';

    const body = new URLSearchParams({
        [cfg.field]: url,
        csrf_token:  csrf,
        ...cfg.extra,
    }).toString();

    const res = await axios.post(cfg.endpoint, body, {
        headers: {
            'Content-Type':     'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'Cookie':           cookie,
            'Origin':           'https://imageyoutube.com',
            'Referer':          cfg.page,
            'User-Agent':       'Mozilla/5.0',
        },
        timeout: 20000,
    });

    return res.data;
}

function parseThumbOrProfile(html) {
    const $ = cheerio.load(html);
    const out = {
        thumbnails: [],
        profile:    [],
        banner:     [],
        frames:     { start: [], middle: [], end: [] },
    };

    $('section').each((_, el) => {
        const title = $(el).find('h5').text().toLowerCase();
        const items = [];
        $(el).find('a[href]').each((_, a) => {
            const href  = $(a).attr('href');
            const label = $(a).text().trim() || $(a).find('button').text().trim() || null;
            if (href) items.push({ resolution: label, url: href });
        });
        if (!items.length) return;
        if (title.includes('profile'))     out.profile        = items;
        else if (title.includes('banner')) out.banner         = items;
        else if (title.includes('player')) out.thumbnails     = items;
        else if (title.includes('start'))  out.frames.start   = items;
        else if (title.includes('middle')) out.frames.middle  = items;
        else if (title.includes('end'))    out.frames.end     = items;
    });

    return out;
}

function parseComment(html) {
    const $ = cheerio.load(html);
    const list = [];
    $('.youtube-image-options a, section a[href]').each((_, el) => {
        const url = $(el).attr('href');
        const res = $(el).find('button').text().trim() || $(el).text().trim();
        if (url) list.push({ resolution: res, url });
    });
    return list;
}

// ── Main handler ───────────────────────────────────────────────
let handler = async (m, { conn, args, text, command }) => {

    const sub = command === 'ytimage' ? (args[0] || '').toLowerCase() : command;
    const url = command === 'ytimage' ? args.slice(1).join(' ').trim() : text;

    const GUIDE = `🎬 *YouTube Image Downloader*
${'─'.repeat(30)}

*What is this?*
Download images from YouTube — including video thumbnails, channel profile pictures, channel banners, and comment images — in full quality.

*Commands:*
• *.ytthumb <link>* — Download video thumbnail
• *.ytprofile <link>* — Download channel profile photo
• *.ytbanner <link>* — Download channel banner
• *.ytcomment <link>* — Download comment images from a video
• *.ytimage thumb/profile/banner/comment <link>* — Unified command

*How to use:*
1. Copy any YouTube video or channel link
2. Send the command followed by the link
3. The bot will fetch and send the image(s) in high quality

*Examples:*
_.ytthumb https://youtu.be/tFhm3KWT7M8?si=k_egUoqHH-cmbXua_
_.ytprofile https://youtube.com/@noureddineouafy2?si=x6K2r40pf7g1opIr_
_.ytbanner https://youtube.com/@noureddineouafy2?si=x6K2r40pf7g1opIr_
_.ytimage thumb https://youtu.be/tFhm3KWT7M8?si=k_egUoqHH-cmbXua_`;

    // Show guide if no sub-command or no URL
    if (!sub || !url) {
        return conn.reply(m.chat, GUIDE, m);
    }

    const MODE_MAP = {
        ytthumb:   'thumb',
        ytprofile: 'profile',
        ytbanner:  'banner',
        ytcomment: 'comment',
        thumb:     'thumb',
        profile:   'profile',
        banner:    'banner',
        comment:   'comment',
    };

    const mode = MODE_MAP[sub];
    if (!mode) return conn.reply(m.chat, `❌ Invalid mode.\nChoices: thumb | profile | banner | comment`, m);

    if (!/youtu/.test(url) && !/youtube\.com/.test(url)) {
        return conn.reply(m.chat, `❌ Please enter a valid YouTube link.\nExample: _https://youtu.be/xxxxx_`, m);
    }

    const sent = await conn.sendMessage(m.chat, { text: '⏳ _Fetching image, please wait..._' }, { quoted: m });

    const editMsg = async (txt) => conn.sendMessage(m.chat, { text: txt, edit: sent.key });

    try {
        const html = await fetchResult(url, mode);

        if (mode === 'comment') {
            const list = parseComment(html);
            if (!list.length) return editMsg('❌ No images found. Make sure the link is valid.');

            await conn.sendMessage(m.chat, { delete: sent.key });

            for (const item of list.slice(0, 4)) {
                await conn.sendMessage(m.chat, {
                    image:   { url: item.url },
                    caption: `🖼️ *Comment Image* — ${item.resolution || 'Full Size'}`,
                }, { quoted: m });
            }
            return;
        }

        const data = parseThumbOrProfile(html);

        let items = [];
        if (mode === 'thumb')   items = data.thumbnails;
        if (mode === 'profile') items = data.profile;
        if (mode === 'banner')  items = data.banner;

        if (!items.length) return editMsg('❌ No images found. Make sure the link is valid.');

        await conn.sendMessage(m.chat, { delete: sent.key });

        const MODE_LABEL = {
            thumb:   '🖼️ Thumbnail',
            profile: '👤 Profile Photo',
            banner:  '🎨 Channel Banner',
        };

        for (const item of items.slice(0, 3)) {
            await conn.sendMessage(m.chat, {
                image:   { url: item.url },
                caption: `${MODE_LABEL[mode] || '📷'} — ${item.resolution || '-'}`,
            }, { quoted: m });
        }

        // Send frame links if available (thumb mode only)
        if (mode === 'thumb') {
            const allFrames = [
                ...data.frames.start,
                ...data.frames.middle,
                ...data.frames.end,
            ];
            if (allFrames.length) {
                let info = `📽️ *Available Frames (${allFrames.length})*\n`;
                info += allFrames.slice(0, 6).map((f, i) => `${i + 1}. ${f.resolution} → ${f.url}`).join('\n');
                await conn.sendMessage(m.chat, { text: info }, { quoted: m });
            }
        }

    } catch (e) {
        console.error('[ytimage]', e.message);
        await editMsg('❌ Failed: ' + e.message);
    }
};

handler.help    = ['ytthumb', 'ytprofile', 'ytbanner', 'ytcomment'];
handler.command = ['ytimage', 'ytthumb', 'ytprofile', 'ytbanner', 'ytcomment'];
handler.tags    = ['downloader'];
handler.limit   = true;
export default handler;
