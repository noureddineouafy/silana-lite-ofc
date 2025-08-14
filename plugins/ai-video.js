// plugin by Noureddine Ouafy 
// scrape by DAFFA 

import axios from 'axios';

// --- Start of AI Generation Logic ---
const aiLabs = {
  api: {
    base: 'https://text2pet.zdex.top',
    endpoints: {
      videos: '/videos',
      videosBatch: '/videos/batch'
    }
  },
  headers: {
    'user-agent': 'NB Android/1.0.0',
    'accept-encoding': 'gzip',
    'content-type': 'application/json',
    authorization: ''
  },
  state: { token: null },
  setup: {
    cipher: 'hbMcgZLlzvghRlLbPcTbCpfcQKM0PcU0zhPcTlOFMxBZ1oLmruzlVp9remPgi0QWP0QW',
    shiftValue: 3,
    dec(text, shift) {
      return [...text].map(c =>
        /[a-z]/.test(c) ?
        String.fromCharCode((c.charCodeAt(0) - 97 - shift + 26) % 26 + 97) :
        /[A-Z]/.test(c) ?
        String.fromCharCode((c.charCodeAt(0) - 65 - shift + 26) % 26 + 65) :
        c
      ).join('');
    },
    decrypt: async () => {
      if (aiLabs.state.token) return aiLabs.state.token;
      const decrypted = aiLabs.setup.dec(aiLabs.setup.cipher, aiLabs.setup.shiftValue);
      aiLabs.state.token = decrypted;
      aiLabs.headers.authorization = decrypted;
      return decrypted;
    }
  },
  deviceId() {
    return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  },
  generateVideo: async (prompt = '', isPremium = 1) => {
    if (!prompt?.trim() || !/^[a-zA-Z0-9\s.,!?'-]+$/.test(prompt)) {
      return { success: false, result: { error: 'Invalid or empty prompt.' } };
    }
    await aiLabs.setup.decrypt();
    try {
      const payload = {
        deviceID: aiLabs.deviceId(),
        isPremium,
        prompt,
        used: [],
        versionCode: 6
      };
      const url = aiLabs.api.base + aiLabs.api.endpoints.videos;
      const res = await axios.post(url, payload, { headers: aiLabs.headers });
      if (res.data.code !== 0 || !res.data.key) {
        return { success: false, result: { error: 'Failed to get generation key.' } };
      }
      return await aiLabs.checkVideo(res.data.key);
    } catch (err) {
      return { success: false, result: { error: err.message } };
    }
  },
  checkVideo: async (key) => {
    if (!key) return { success: false, result: { error: 'Invalid video key.' } };
    await aiLabs.setup.decrypt();
    const payload = { keys: [key] };
    const url = aiLabs.api.base + aiLabs.api.endpoints.videosBatch;
    const delay = 2000;
    for (let i = 0; i < 100; i++) {
      try {
        const res = await axios.post(url, payload, { headers: aiLabs.headers, timeout: 15000 });
        const data = res.data?.datas?.[0];
        if (data?.url?.trim()) {
          return { success: true, result: { url: data.url.trim(), safe: data.safe === 'true', key: data.key } };
        }
        await new Promise(r => setTimeout(r, delay));
      } catch (err) {
        await new Promise(r => setTimeout(r, delay));
      }
    }
    return { success: false, result: { error: 'Video generation timed out.' } };
  }
};
// --- End of AI Generation Logic ---

let handler = async (m, { conn, text }) => {
  if (!text) throw `Usage: .ai-video your prompt here`;
  await m.reply(`⏳ Generating your video... Please wait.`);
  const response = await aiLabs.generateVideo(text);
  if (response.success) {
    await conn.sendFile(m.chat, response.result.url, '', `*Prompt:* ${text}`, m);
  } else {
    await m.reply(response.result.error);
  }
};

handler.help = ['ai-video'];
handler.command = ['ai-video'];
handler.tags = ['ai'];
handler.limit = true;

export default handler;
