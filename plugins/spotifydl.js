
/**
 * plugin by noureddine ouafy
 * Spotify Downloader Scraper
 * Base: https://spotisongdownloader.to/
 * By: wolep // daffa channel 
 * Last Updated: 2025-08-11
 */

import fetch from 'node-fetch';

const spotify = {
    tools: {
        async hit(description, url, options, returnType = "text") {
            try {
                const response = await fetch(url, options);
                if (!response.ok) throw new Error(`${response.status} ${response.statusText}\n${await response.text() || '(empty response body)'}`);
                
                if (returnType === "text") {
                    const data = await response.text();
                    return { data, response };
                } else if (returnType === "json") {
                    const data = await response.json();
                    return { data, response };
                } else {
                    throw new Error(`Invalid returnType parameter.`);
                }
            } catch (e) {
                throw new Error(`Failed to hit ${description}: ${e.message}`);
            }
        }
    },

    get baseUrl() {
        return "https://spotisongdownloader.to";
    },

    get baseHeaders() {
        return {
            "accept-encoding": "gzip, deflate, br, zstd",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0"
        };
    },

    // 1. Get a cookie from the homepage
    async getCookie() {
        const url = this.baseUrl;
        const headers = this.baseHeaders;
        const { response } = await this.tools.hit(`homepage`, url, { headers });
        // FIX: Use .raw()['set-cookie'] which is provided by node-fetch to get an array of cookies
        const rawCookies = response.headers.raw()['set-cookie'];
        let cookie = rawCookies?.[0]?.split("; ")?.[0];
        if (!cookie?.length) throw new Error(`Failed to retrieve cookie.`);
        cookie += "; _ga=GA1.1.2675401.1754827078";
        return { cookie };
    },

    // 2. Validate the cookie
    async ifCaptcha(gcObject) {
        const pathname = '/ifCaptcha.php';
        const url = new URL(pathname, this.baseUrl);
        const headers = {
            "referer": new URL(this.baseUrl).href,
            ...gcObject,
            ...this.baseHeaders
        };
        await this.tools.hit(`ifCaptcha`, url, { headers });
        return headers;
    },

    // 3. Retrieve single track metadata
    async singleTrack(spotifyTrackUrl, icObject) {
        const pathname = '/api/composer/spotify/xsingle_track.php';
        const url = new URL(pathname, this.baseUrl);
        url.search = new URLSearchParams({ url: spotifyTrackUrl });
        const { data } = await this.tools.hit(`single track`, url, { headers: icObject }, 'json');
        return data;
    },

    // 4. Hit the track page to enable download access
    async singleTrackHtml(stObject, icObj) {
        const payload = [
            stObject.song_name,
            stObject.duration,
            stObject.img,
            stObject.artist,
            stObject.url,
            stObject.album_name,
            stObject.released
        ];
        const pathname = '/track.php';
        const url = new URL(pathname, this.baseUrl);
        const body = new URLSearchParams({ data: JSON.stringify(payload) });
        await this.tools.hit(`track html`, url, { headers: icObj, body, method: 'post' });
    },

    // 5. Get the actual download URL
    async downloadUrl(spotifyTrackUrl, icObj, stObj) {
        const pathname = '/api/composer/spotify/ssdw23456ytrfds.php';
        const url = new URL(pathname, this.baseUrl);
        const body = new URLSearchParams({
            "song_name": "",
            "artist_name": "",
            "url": spotifyTrackUrl,
            "zip_download": "false",
            "quality": "m4a"
        });
        const { data } = await this.tools.hit(`get download url`, url, { headers: icObj, body, method: 'post' }, 'json');
        return { ...data, ...stObj };
    },

    // Main function to orchestrate the download process
    async download(spotifyTrackUrl) {
        const gcObj = await this.getCookie();
        const icObj = await this.ifCaptcha(gcObj);
        const stObj = await this.singleTrack(spotifyTrackUrl, icObj);
        if (stObj.res !== 200) throw new Error(`Track not found or failed to retrieve metadata. Status: ${stObj.res}`);
        await this.singleTrackHtml(stObj, icObj);
        const dlObj = await this.downloadUrl(spotifyTrackUrl, icObj, stObj);
        return dlObj;
    }
};

// --- Bot Handler ---

const handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        return m.reply(`Please provide a Spotify track URL.\n\n*Example:* ${usedPrefix}${command} https://open.spotify.com/track/1ibeKVCiXORhvUpMmtsQWq`);
    }

    const spotifyUrlRegex = /(https?:\/\/(?:open\.)?spotify\.com\/track\/[a-zA-Z0-9]+)/;
    const match = text.match(spotifyUrlRegex);

    if (!match) {
        return m.reply(`Invalid Spotify track URL. Please make sure the link is correct.`);
    }

    const url = match[0];
    await m.reply('*Downloading your song, please wait...* 🎵');

    try {
        const result = await spotify.download(url);

        if (result.status !== 'success' || !result.dlink) {
            throw new Error('Failed to get the download link. The song might be protected or unavailable.');
        }

        const caption = `
🎶 *Title:* ${result.song_name}
🎤 *Artist:* ${result.artist}
📀 *Album:* ${result.album_name}
📅 *Released:* ${result.released}
        `;

        // Send the album art and caption, then send the audio file
        await conn.sendMessage(m.chat, { image: { url: result.img }, caption: caption }, { quoted: m });
        await conn.sendMessage(m.chat, { audio: { url: result.dlink }, mimetype: 'audio/mp4' }, { quoted: m });

    } catch (error) {
        console.error('Spotify Handler Error:', error);
        m.reply(`An error occurred: ${error.message}`);
    }
};

handler.help = ['spotifydl'];
handler.command = ['spotifydl'];
handler.tags = ['downloader'];
handler.limit = true; // Assumes a limiter/premium system is in place

export default handler;
