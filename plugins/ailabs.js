// Instagram: noureddine_ouafy
// AI Image & Video Generator (Ailabs)
// Source: https://whatsapp.com/channel/0029Vb6gPQsEawdrP0k43635

import axios from 'axios';
import chalk from 'chalk';
import FormData from 'form-data';

const aiLabs = {
    api: {
        base: 'https://text2video.aritek.app',
        endpoints: {
            text2img: '/text2img',
            generate: '/txt2videov3',
            video: '/video'
        }
    },
    headers: {
        'user-agent': 'NB Android/1.0.0',
        'accept-encoding': 'gzip',
        'content-type': 'application/json',
        authorization: ''
    },
    state: {
        token: null
    },
    setup: {
        cipher: 'hbMcgZLlzvghRlLbPcTbCpfcQKM0PcU0zhPcTlOFMxBZ1oLmruzlVp9remPgi0QWP0QW',
        shiftValue: 3,
        dec(text, shift) {
            return [...text].map(c =>
                /[a-z]/.test(c)
                    ? String.fromCharCode((c.charCodeAt(0) - 97 - shift + 26) % 26 + 97)
                    : /[A-Z]/.test(c)
                        ? String.fromCharCode((c.charCodeAt(0) - 65 - shift + 26) % 26 + 65)
                        : c
            ).join('');
        },
        async decrypt() {
            if (aiLabs.state.token) return aiLabs.state.token;
            const decrypted = aiLabs.setup.dec(aiLabs.setup.cipher, aiLabs.setup.shiftValue);
            aiLabs.state.token = decrypted;
            aiLabs.headers.authorization = decrypted;
            return decrypted;
        }
    },
    deviceId() {
        return Array.from({ length: 16 }, () =>
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    },
    async text2img(prompt) {
        if (!prompt?.trim()) {
            return { success: false, code: 400, result: { error: 'Prompt cannot be empty.' } };
        }
        const token = await aiLabs.setup.decrypt();
        const form = new FormData();
        form.append('prompt', prompt);
        form.append('token', token);

        try {
            const url = aiLabs.api.base + aiLabs.api.endpoints.text2img;
            const res = await axios.post(url, form, {
                headers: { ...aiLabs.headers, ...form.getHeaders() }
            });
            const { code, url: imageUrl } = res.data;

            if (code !== 0 || !imageUrl) {
                return { success: false, code: res.status, result: { error: 'Image generation failed.' } };
            }
            return { success: true, code: res.status, result: { url: imageUrl.trim(), prompt } };
        } catch (err) {
            return { success: false, code: err.response?.status || 500, result: { error: err.message } };
        }
    },
    async generate({ prompt = '', type = 'video', isPremium = 1 } = {}) {
        if (!prompt?.trim() || !/^[a-zA-Z0-9\s.,!?'"-]+$/.test(prompt)) {
            return { success: false, code: 400, result: { error: 'Invalid or empty prompt.' } };
        }
        if (!/^(image|video)$/.test(type)) {
            return { success: false, code: 400, result: { error: 'Invalid type. Use "image" or "video".' } };
        }

        if (type === 'image') {
            return await aiLabs.text2img(prompt);
        } else {
            await aiLabs.setup.decrypt();
            const payload = {
                deviceID: aiLabs.deviceId(),
                isPremium,
                prompt,
                used: [],
                versionCode: 59
            };
            try {
                const url = aiLabs.api.base + aiLabs.api.endpoints.generate;
                const res = await axios.post(url, payload, { headers: aiLabs.headers });
                const { code, key } = res.data;

                if (code !== 0 || !key) {
                    return { success: false, code: res.status, result: { error: 'Failed to get video key.' } };
                }
                return await aiLabs.video(key);
            } catch (err) {
                return { success: false, code: err.response?.status || 500, result: { error: err.message } };
            }
        }
    },
    async video(key) {
        if (!key) {
            return { success: false, code: 400, result: { error: 'Invalid video key.' } };
        }
        await aiLabs.setup.decrypt();
        const payload = { keys: [key] };
        const url = aiLabs.api.base + aiLabs.api.endpoints.video;
        const maxAttempts = 100;
        const delay = 2000;
        let attempt = 0;

        while (attempt < maxAttempts) {
            attempt++;
            try {
                const res = await axios.post(url, payload, {
                    headers: aiLabs.headers,
                    timeout: 15000
                });
                const { code, datas } = res.data;

                if (code === 0 && Array.isArray(datas) && datas.length > 0) {
                    const data = datas[0];
                    if (!data.url) {
                        await new Promise(r => setTimeout(r, delay));
                        continue;
                    }
                    return { success: true, code: res.status, result: { url: data.url.trim(), key: data.key, progress: '100%' } };
                }
            } catch (err) {
                const retry = ['ECONNRESET', 'ECONNABORTED', 'ETIMEDOUT'].includes(err.code);
                if (retry && attempt < maxAttempts) {
                    await new Promise(r => setTimeout(r, delay));
                    continue;
                }
                return { success: false, code: err.response?.status || 500, result: { error: err.message } };
            }
        }
        return { success: false, code: 504, result: { error: 'Video processing timed out.', attempt } };
    }
};

let handler = async (m, { args, conn, usedPrefix, command }) => {
    const fkontak = {
        key: { participants: "0@s.whatsapp.net", remoteJid: "status@broadcast", fromMe: false, id: "Hello" },
        message: { contactMessage: { vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${global.nameowner};Bot;;;\nFN:${global.nameowner}\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Mobile\nEND:VCARD` } },
        participant: "0@s.whatsapp.net"
    };

    try {
        if (!args.length) {
            return conn.reply(m.chat, `What do you want to generate?\n\nExample:\n${usedPrefix + command} a girl in the forest --image\n${usedPrefix + command} a cat jumping --video`, fkontak);
        }

        let type = 'image';
        if (args.includes('--image')) type = 'image';
        if (args.includes('--video')) type = 'video';
        let prompt = args.filter(a => a !== '--image' && a !== '--video').join(' ').trim();
        if (!prompt) return conn.reply(m.chat, 'Prompt cannot be empty.', fkontak);

        await conn.reply(m.chat, global.wait, fkontak);

        let result = await aiLabs.generate({ prompt, type });

        if (!result.success) return conn.reply(m.chat, `❌ Failed: ${result.result.error}`, fkontak);

        if (type === 'image') {
            await conn.sendMessage(m.chat, { image: { url: result.result.url }, caption: `✅ *Image:* ${result.result.prompt}\n${global.wm}` }, { quoted: fkontak });
        } else {
            await conn.sendMessage(m.chat, { video: { url: result.result.url }, caption: `✅ *Video:* ${prompt}\n${global.wm}` }, { quoted: fkontak });
        }

        await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error(err);
        await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
        conn.reply(m.chat, global.eror, fkontak);
    }
};

handler.help = ['ailabs'];
handler.tags = ['ai'];
handler.command = /^ailabs$/i;
handler.limit = true;
handler.premium = false;
export default handler;
