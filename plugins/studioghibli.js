// plugin by noureddine ouafy
// scrape and Author by DAFFA 

import axios from 'axios';
import { createDecipheriv } from 'crypto';

/**
 * Ghibli AI Image Generator Module
 * Adapted for use in a bot environment.
 */
const ghibai = {
  api: {
    base: 'https://generate-api.ghibli-gpt.net',
    endpoints: {
      generate: '/v1/gpt4o-image/generate',
      task: '/v1/gpt4o-image/record-info',
    },
  },

  headers: {
    'accept': '*/*',
    'content-type': 'application/json',
    'origin': 'https://ghibli-gpt.net',
    'referer': 'https://ghibli-gpt.net/',
    'user-agent': 'NB Android/1.0.0',
    'authorization': '',
  },

  state: { token: null },

  security: {
    keyBase64: 'UBsnTxs80g8p4iW72eYyPaDvGZbpzun8K2cnoSSEz1Y',
    ivBase64: 'fG1SBDUyE2IG8kPw',
    ciphertextBase64: '2QpqZCkOD/WMHixMqt46AvhdKRYgy5aUMLXi6D0nOPGuDbH4gbNKDV0ZW/+9w9I=',

    decrypt: async () => {
      if (ghibai.state.token) return ghibai.state.token;

      const buf = k => Buffer.from(ghibai.security[k], 'base64');
      const [key, iv, ciphertext] = ['keyBase64', 'ivBase64', 'ciphertextBase64'].map(buf);

      const decipher = createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(ciphertext.slice(-16));

      const decrypted = decipher.update(ciphertext.slice(0, -16), undefined, 'utf8') + decipher.final('utf8');
      ghibai.state.token = decrypted;
      ghibai.headers.authorization = `Bearer ${decrypted}`;
      return decrypted;
    }
  },

  prepare: async (imageDataUrl) => {
    if (!imageDataUrl || typeof imageDataUrl !== 'string' || !/^data:image\//.test(imageDataUrl)) {
       return { filesUrl: [''], files: [''] };
    }
    return { filesUrl: [''], files: [imageDataUrl] };
  },

  getTask: async (taskId, prompt = '', onProgress) => {
    await ghibai.security.decrypt();

    for (let i = 0; i < 60; i++) { // Poll for 3 minutes max (60 attempts * 3 seconds)
      try {
        const { data } = await axios.get(`${ghibai.api.base}${ghibai.api.endpoints.task}?taskId=${taskId}`, { headers: ghibai.headers });
        const d = data?.data || {};
        const status = d.status || 'UNKNOWN';
        const progress = parseFloat(d.progress || '0').toFixed(2);

        if (typeof onProgress === 'function') {
          onProgress({ status, progress });
        }

        if (status === 'SUCCESS' && d.response?.resultUrls?.length) {
          return {
            success: true,
            code: 200,
            result: {
              type: 'image',
              prompt,
              taskId,
              progress,
              link: d.response.resultUrls[0],
              thumbnail: d.response.thumbnailUrls?.[0],
              source: d.response.sourceUrls?.[0]
            }
          };
        }

        await new Promise(r => setTimeout(r, 3000));
      } catch (err) {
        const status = err.response?.status || 500;
        if (status === 429) { // Too Many Requests
          if (typeof onProgress === 'function') onProgress({ status: 'RATE_LIMITED', progress: 'Retrying...' });
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }
        return { success: false, code: status, result: { error: err.message } };
      }
    }

    return { success: false, code: 504, result: { error: 'Request timed out. Please try again. 😂' } };
  },

  generate: async (prompt, image, size = '2:3', nVariants = 1, onProgress) => {
    if (!prompt?.trim()) {
      return { success: false, code: 400, result: { error: 'A prompt is required!' } };
    }
    if (!image) {
      return { success: false, code: 400, result: { error: 'An image is required! Please reply to an image. 🫵🏻🗿' } };
    }

    const { filesUrl, files } = await ghibai.prepare(image);
    if (!files[0]) {
      return { success: false, code: 400, result: { error: 'Invalid image format provided. Please try another one. 😂' } };
    }

    await ghibai.security.decrypt();

    try {
      const { data } = await axios.post(
        `${ghibai.api.base}${ghibai.api.endpoints.generate}`,
        { filesUrl, files, prompt, size, nVariants },
        { headers: ghibai.headers }
      );

      const taskId = data?.data?.taskId;
      if (!taskId) {
        return { success: false, code: 500, result: { error: 'Failed to retrieve a Task ID from the server. 😏' } };
      }

      if (typeof onProgress === 'function') onProgress({ status: 'UPLOADED', progress: 'Waiting for server...' });
      return await ghibai.getTask(taskId, prompt, onProgress);

    } catch (err) {
      const status = err.response?.status || 500;
      if (status === 429) {
        if (typeof onProgress === 'function') onProgress({ status: 'RATE_LIMITED', progress: 'Retrying...' });
        await new Promise(r => setTimeout(r, 5000));
        return await ghibai.generate(prompt, image, size, nVariants, onProgress);
      }
      return { success: false, code: status, result: { error: err.message } };
    }
  }
};


/**
 * Bot Command Handler
 */
let handler = async (m, { conn, text, command }) => {
  try {
    let quoted = m.quoted ? m.quoted : m;
    let mime = (quoted.msg || quoted).mimetype || '';
    if (!/image/g.test(mime)) throw 'Error: Please reply to an image to use this command.';
    
    // **Updated error message for missing prompt**
    if (!text) {
      throw `You're missing the prompt! Please tell me what to do with the image.\n\n*Example:*\n.${command} turn this into a Ghibli anime style character`;
    }

    let imgBuffer = await quoted.download();
    let imageDataUrl = `data:${mime};base64,${imgBuffer.toString('base64')}`;
    
    let waitingMessage = await conn.reply(m.chat, '🎨 Creating your Ghibli-style image... Please wait.', m);

    // **Corrected onProgress function**
    const onProgress = (progressData) => {
      const { status, progress } = progressData;
      conn.sendMessage(m.chat, {
        text: `🎨 Generating...\n\n*Status:* ${status}\n*Progress:* ${progress}%`,
        edit: waitingMessage.key 
      });
    };

    const result = await ghibai.generate(text, imageDataUrl, '2:3', 1, onProgress);
    
    if (result.success) {
      await conn.sendFile(m.chat, result.result.link, 'ghibli_result.jpg', `*✨ Here is your image!*\n\n*Prompt:* ${result.result.prompt}`, m);
    } else {
      await conn.reply(m.chat, `*An error occurred:*\n${result.result.error}`, m);
    }

  } catch (e) {
    // Reply with the error message instead of logging it to the console
    await conn.reply(m.chat, e.toString(), m);
  }
};

handler.help = ['studioghibli'];
handler.command = ['studioghibli'];
handler.tags = ['ai'];
handler.limit = true; 
export default handler;
