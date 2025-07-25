/*
plugin by noureddine ouafy
scrape by wolfyflutter
  base    : https://keepv.id/
  note    : Final correction for JSON parsing and header issues.
  by      : wolep & Gemini 🙂
  update  : 25 juillet 2025
*/

const keepv = {
    tools: {
        generateHex: (length = 10, config = { prefix: "" }) => {
            const charSet = "0123456789abcdef";
            const charSetArr = charSet.split("");
            const getRandom = (array) => array[Math.floor(Math.random() * array.length)];
            const randomString = Array.from({ length }, _ => getRandom(charSetArr)).join("");
            return config.prefix + randomString;
        },
        generateTokenValidTo: () => (Date.now() + (1000 * 60 * 20)).toString().substring(0, 10),
        mintaJson: async (description, url, options) => {
            try {
                const response = await fetch(url, options);
                if (!response.ok) throw Error(`${response.status} ${response.statusText}\n${await response.text() || '(empty content)'}`);
                return await response.json();
            } catch (err) {
                throw Error(`gagal mintaJson ${description} -> ${err.message}`);
            }
        },
        validateString: (description, theVariable) => {
            if (typeof (theVariable) !== "string" || theVariable?.trim()?.length === 0) {
                throw Error(`variabel ${description} harus string dan gak boleh kosong`);
            }
        },
        delay: async (ms) => new Promise(re => setTimeout(re, ms)),
        handleFormat: (desireFormat) => {
            const validParam = ["audio", "240p", "360p", "480p", "720p", "1080p", "best_video"];
            if (!validParam.includes(desireFormat)) throw Error(`${desireFormat} is invalid format. just pick one of these: ${validParam.join(", ")}`);
            let result = desireFormat.match(/^(\d+)p/)?.[1];
            if (!result) {
                result = desireFormat === validParam[0] ? desireFormat : "10000";
            }
            return result;
        }
    },
    konstanta: {
        origin: "https://keepv.id",
        baseHeaders: {
            "accept": "application/json, text/javascript, */*; q=0.01",
            "accept-language": "en-US,en;q=0.9",
            "sec-ch-ua": "\"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\", \"Google Chrome\";v=\"138\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
        }
    },

    async getCookieAndRedirectUrl(origin, baseHeaders) {
        try {
            const r = await fetch(origin, { headers: baseHeaders, redirect: 'follow' });
            if (!r.ok) throw Error(`${r.status} ${r.statusText}\n${await r.text() || `(empty response)`}`);
            const h = r.headers;
            const cookieHeader = h.get('set-cookie');
            if (!cookieHeader) throw Error(`'set-cookie' header was not found in the response.`);
            
            const cookie = cookieHeader.split(';')[0];
            if (!cookie) throw Error(`Failed to parse the cookie from the 'set-cookie' header.`);
            
            return { cookie, urlRedirect: r.url };
        } catch (error) {
            throw Error(`getCookie function failed. ${error.message}`);
        }
    },

    async validateCookie(resultGetCookieAndRedirectUrl, origin, youtubeUrl, baseHeaders, format) {
        const { cookie, urlRedirect } = resultGetCookieAndRedirectUrl;
        const headers = { ...baseHeaders, cookie, referer: urlRedirect };
        const pathname = format === "audio" ? "button" : "vidbutton";
        const url = `${origin}/${pathname}/?url=${encodeURIComponent(youtubeUrl)}`;
        const r = await fetch(url, { headers });
        if (!r.ok) throw Error(`${r.status} ${r.statusText}\n${await r.text() || `(empty response)`}`);
        return { cookie, referer: url };
    },

    async convert(resultValidateCookie, origin, youtubeUrl, baseHeaders, format) {
        const { cookie, referer } = resultValidateCookie;
        const headers = {
            ...baseHeaders,
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "origin": origin,
            "x-requested-with": "XMLHttpRequest",
            cookie,
            referer
        };

        const payload = {
            url: youtubeUrl,
            convert: "gogogo",
            token_id: this.tools.generateHex(64, { prefix: "t_" }),
            token_validto: this.tools.generateTokenValidTo(),
        };
        if (format !== "audio") payload.height = format;
        
        const body = new URLSearchParams(payload);
        const pathname = format === "audio" ? "convert" : "vidconvert";
        const url = `${origin}/${pathname}/`;
        
        const result = await this.tools.mintaJson(`convert`, url, { method: "POST", headers, body });
        if (result.error) throw Error(`Conversion failed. Server error: \n${result.error}`);
        if (!result.jobid) throw Error(`Job ID is missing.`);
        
        return result;
    },

    async checkJob(resultValidateCookie, resultConvert, origin, baseHeaders, format, identifier, progressCallback) {
        const { cookie, referer } = resultValidateCookie;
        const { jobid } = resultConvert;
        const headers = {
            ...baseHeaders,
            cookie,
            referer,
            "x-requested-with": "XMLHttpRequest",
        };

        const usp = new URLSearchParams({ jobid, time: Date.now() });
        const pathname = format === "audio" ? "convert" : "vidconvert";
        const url = new URL(`${origin}/${pathname}/`);
        url.search = usp;

        const MAX_FETCH_ATTEMPT = 60;
        const FETCH_INTERVAL = 5000;
        
        for (let fetchCount = 0; fetchCount < MAX_FETCH_ATTEMPT; fetchCount++) {
            const r = await fetch(url, { headers });
            const data = await r.json();

            if (data.dlurl) return data;
            if (data.error) throw Error(`Error during job check:\n${JSON.stringify(data, null, 2)}`);
            
            let message = data.retry;
            if (message) {
                if (message.startsWith("Downloading audio data")) {
                    const temp = message.match(/^(.+?)<(?:.+?)valuenow=\"(.+?)\"/);
                    message = temp ? `${temp[1]} ${temp[2]}%` : message;
                } else {
                    message = message.match(/^(.+?)</)?.[1] || message;
                }
                progressCallback?.(`${identifier} job status: ${message}`);
            }
            
            await this.tools.delay(FETCH_INTERVAL);
        }
        
        throw Error(`Reached maximum fetch attempts.`);
    },

    async download(youtubeUrl, userFormat = "audio", owner = "", progressCallback) {
        this.tools.validateString(`youtube url`, youtubeUrl);
        const format = this.tools.handleFormat(userFormat);
        const identifier = this.tools.generateHex(4, { prefix: owner.trim().length ? `${owner.trim()}-` : "" });
        
        progressCallback?.(`[NEW TASK] ${identifier}`);

        const origin = this.konstanta.origin;
        const headers = this.konstanta.baseHeaders;

        const resultGCARU = await this.getCookieAndRedirectUrl(origin, headers);
        const resultVC = await this.validateCookie(resultGCARU, origin, youtubeUrl, headers, format);
        const resultConvert = await this.convert(resultVC, origin, youtubeUrl, headers, format);
        const result = await this.checkJob(resultVC, resultConvert, origin, headers, format, identifier, progressCallback);

        const type = userFormat === "audio" ? "audio" : "video";
        return { ...result, identifier, type, title: resultConvert.title || 'Untitled' };
    }
};

// Handler implementation
let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) throw `*Veuillez fournir une URL YouTube.*\n\n*Exemple:* ${usedPrefix + command} https://youtube.com/watch?v=HJAb8wgqAFc 720p \n\n for download mp3 type like this \n\n.keepvid url audio `;

    const urlRegex = /(?:https?:\/\/)?(?:www\.)?(?:m\.youtube\.com|youtube\.com|youtu\.be)\/(?:watch\?v=)?([\w-]{11})/;
    const urlMatch = text.match(urlRegex);
    if (!urlMatch) throw '*Veuillez fournir une URL YouTube valide.*';
    
    const youtubeUrl = urlMatch[0];
    const args = text.substring(urlMatch.index + youtubeUrl.length).trim().split(' ').filter(Boolean);
    
    // Default to 720p if no quality is specified. User can type 'audio' for audio.
    let format = args[0] || '720p';

    try {
        let statusMsg = await m.reply(`🚀 Lancement du téléchargement pour...\n\n*URL:* ${youtubeUrl}\n*Format:* ${format}`);
        
        const progressCallback = (progress) => {
             conn.relayMessage(m.chat, {
                protocolMessage: {
                    key: statusMsg.key,
                    type: 14,
                    editedMessage: { conversation: `⏳ ${progress}` }
                }
            }, {});
        };

        const result = await keepv.download(youtubeUrl, format, m.sender, progressCallback);

        let caption = `✅ *Téléchargement Terminé*\n\n*Titre:* ${result.title}\n*Identifiant:* ${result.identifier}\n*Type:* ${result.type}`;
        
        await conn.sendFile(m.chat, result.dlurl, `${result.title.replace(/[<>:"/\\|?*]/g, '')}.${result.type === 'video' ? 'mp4' : 'mp3'}`, caption, m);
        
        // Optionally delete the status message after sending the file
        await conn.relayMessage(m.chat, { protocolMessage: { key: statusMsg.key, type: 0 } }, {});

    } catch (err) {
        console.error(err);
        await m.reply(`*Une erreur est survenue:*\n${err.message}`);
    }
};

handler.help = ['keepvid'];
handler.command = ['keepvid'];
handler.tags = ['downloader'];
handler.limit = true;
handler.premium = false;

export default handler;
