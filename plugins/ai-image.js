// plugin by Noureddine Ouafy 
// scrape by DAFFA 

import axios from 'axios';

// --- Start of AI Generation Logic ---
const aiLabs = {
  api: {
    base: 'https://text2pet.zdex.top',
    endpoints: {
      images: '/images'
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
  generateImage: async (prompt = '') => {
    if (!prompt?.trim() || !/^[a-zA-Z0-9\s.,!?'-]+$/.test(prompt)) {
      return { success: false, result: { error: 'Invalid or empty prompt.' } };
    }
    await aiLabs.setup.decrypt();
    try {
      const payload = { prompt };
      const url = aiLabs.api.base + aiLabs.api.endpoints.images;
      const res = await axios.post(url, payload, { headers: aiLabs.headers });
      if (res.data.code !== 0 || !res.data.data) {
        return { success: false, result: { error: 'Image generation failed.' } };
      }
      return { success: true, result: { url: res.data.data, prompt } };
    } catch (err) {
      return { success: false, result: { error: err.message } };
    }
  }
};
// --- End of AI Generation Logic ---

let handler = async (m, { conn, text }) => {
  if (!text) throw `Usage: .ai-image your prompt here`;
  await m.reply(`⏳ Generating your image... Please wait.`);
  const response = await aiLabs.generateImage(text);
  if (response.success) {
    await conn.sendFile(m.chat, response.result.url, '', `*Prompt:* ${text}`, m);
  } else {
    await m.reply(response.result.error);
  }
};

handler.help = ['ai-image'];
handler.command = ['ai-image'];
handler.tags = ['ai'];
handler.limit = true;
export default handler;
