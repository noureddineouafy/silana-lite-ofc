// plugin by noureddine ouafy
// scrape by wolep

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

let handler = async (m, { conn, text, args }) => {
    const queryOrUrl = args[0] || text;
    const userFormat = args[1] || 'mp3';

    if (!queryOrUrl) return conn.sendMessage(m.chat, { text: "❌ المرجو وضع رابط يوتيوب أو نص البحث" }, { quoted: m });

    const yt = {
        get baseUrl() {
            return { origin: 'https://ssvid.net' }
        },

        get baseHeaders() {
            return {
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'origin': this.baseUrl.origin,
                'referer': this.baseUrl.origin + '/youtube-to-mp3'
            }
        },

        validateFormat(userFormat) {
            const validFormat = ['mp3', '360p', '720p', '1080p'];
            if (!validFormat.includes(userFormat)) throw Error(`Invalid format! Available: ${validFormat.join(', ')}`);
        },

        handleFormat(userFormat, searchJson) {
            this.validateFormat(userFormat);
            let result;
            if (userFormat === 'mp3') {
                result = searchJson.links?.mp3?.mp3128?.k;
            } else {
                let selectedFormat;
                const allFormats = Object.entries(searchJson.links.mp4);
                const quality = allFormats
                    .map(v => v[1].q)
                    .filter(v => /\d+p/.test(v))
                    .map(v => parseInt(v))
                    .sort((a, b) => b - a)
                    .map(v => v + 'p');
                if (!quality.includes(userFormat)) {
                    selectedFormat = quality[0];
                } else {
                    selectedFormat = userFormat;
                }
                const find = allFormats.find(v => v[1].q == selectedFormat);
                result = find?.[1]?.k;
            }
            if (!result) throw Error(`${userFormat} not available`);
            return result;
        },

        hit: async function (path, payload) {
            try {
                const body = new URLSearchParams(payload);
                const r = await fetch(`${this.baseUrl.origin}${path}`, {
                    method: 'POST',
                    headers: this.baseHeaders,
                    body
                });
                if (!r.ok) throw Error(`${r.status} ${r.statusText}\n${await r.text()}`);
                return await r.json();
            } catch (e) {
                throw Error(`${path}\n${e.message}`);
            }
        },

        download: async function (queryOrYtUrl, userFormat = 'mp3') {
            this.validateFormat(userFormat);
            let search = await this.hit('/api/ajax/search', {
                "query": queryOrYtUrl,
                "cf_token": "",
                "vt": "youtube"
            });

            if (search.p === 'search') {
                if (!search?.items?.length) throw Error(`No results for ${queryOrYtUrl}`);
                const { v, t } = search.items[0];
                const videoUrl = 'https://www.youtube.com/watch?v=' + v;
                search = await this.hit('/api/ajax/search', {
                    "query": videoUrl,
                    "cf_token": "",
                    "vt": "youtube"
                });
            }

            const vid = search.vid;
            const k = this.handleFormat(userFormat, search);
            const convert = await this.hit('/api/ajax/convert', { k, vid });

            if (convert.c_status === 'CONVERTING') {
                let convert2;
                const limit = 5;
                let attempt = 0;
                do {
                    attempt++;
                    convert2 = await this.hit('/api/convert/check?hl=en', { vid, b_id: convert.b_id });
                    if (convert2.c_status === 'CONVERTED') return convert2;
                    await new Promise(r => setTimeout(r, 5000));
                } while (attempt < limit && convert2.c_status === 'CONVERTING');
                throw Error('File not ready / unknown status');
            } else {
                return convert;
            }
        }
    };

    try {
        const result = await yt.download(queryOrUrl, userFormat);
        const tempFile = path.join('./', `ssvid_${Date.now()}.${userFormat === 'mp3' ? 'mp3' : 'mp4'}`);
        const resBuffer = await fetch(result.dlink).then(r => r.arrayBuffer());
        fs.writeFileSync(tempFile, Buffer.from(resBuffer));

        await conn.sendMessage(m.chat, {
            [userFormat === 'mp3' ? 'audio' : 'video']: fs.readFileSync(tempFile),
            mimetype: userFormat === 'mp3' ? 'audio/mpeg' : 'video/mp4',
            caption: `✅ Downloaded: ${result.title}`,
        }, { quoted: m });

        fs.unlinkSync(tempFile);
    } catch (err) {
        await conn.sendMessage(m.chat, { text: "❌ Error: " + err.message }, { quoted: m });
    }
};

handler.help = handler.command = ['ssvid-mp3'];
handler.tags = ['downloader'];
handler.limit = true;

export default handler;
