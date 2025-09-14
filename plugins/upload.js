import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

/*
 * Base: https://put.icu/
 * Author: Shannz
 * This is the core logic for interacting with the put.icu API.
 */
const puticu = {
  upload: async (filePath, options = {}) => {
    try {
      const {
        password = '',
        expires = 86400,
        randomize = true
      } = options;

      let data = new FormData();
      data.append('randomize', randomize.toString());
      data.append('expires', expires.toString());

      if (password) {
        data.append('null', 'on');
        data.append('access_key', password);
      } else {
        data.append('access_key', '');
      }

      data.append('file', fs.createReadStream(filePath));

      let config = {
        method: 'POST',
        url: 'https://put.icu/upload',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...data.getHeaders() // Important for multipart/form-data
        },
        data: data
      };

      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      // Provide more detailed error feedback
      throw new Error(`Upload failed: ${error.response ? error.response.statusText : error.message}`);
    }
  },
  // The delete function is retained here for completeness, though not used in this specific handler.
  delete: async (fileUrl, deleteKey) => {
    try {
      let config = {
        method: 'DELETE',
        url: fileUrl,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
          'Linx-Delete-Key': deleteKey,
          'Origin': 'https://put.icu',
          'Referer': 'https://put.icu/'
        }
      };

      const response = await axios.request(config);
      return response.data || 'DELETED';
    } catch (error) {
      throw new Error(`Delete failed: ${error.response ? error.response.statusText : error.message}`);
    }
  }
};

/**
 * WhatsApp Bot Command Handler
 *
 * This handler allows users to upload media to put.icu by replying to a message.
 */
let handler = async (m, {
  conn
}) => {
  let q = m.quoted ? m.quoted : m;
  let mime = (q.msg || q).mimetype || '';
  if (!mime) {
    throw '❌ No media found. Please reply to an image, video, or document to upload.';
  }

  // Create a temporary directory if it doesn't exist
  const tmpDir = './tmp';
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
  }

  await m.reply('⏳ Uploading your file, please wait...');

  const media = await q.download();
  const tmpFilePath = `${tmpDir}/${Date.now()}`; // Create a unique temp file path

  try {
    // Write media to a temporary file
    await fs.promises.writeFile(tmpFilePath, media);

    // Upload the file using the puticu function
    const result = await puticu.upload(tmpFilePath);

    if (!result || !result.url) {
      throw new Error('Upload failed. The API did not return a valid URL.');
    }

    // Format the result into a clean, readable message
    const replyText = `
✅ *Upload Successful!*

🔗 *URL:* ${result.url}
🗑️ *Delete URL:* ${result.delete_url}
🔑 *Delete Key:* \`\`\`${result.delete_key}\`\`\`
    `.trim();

    await m.reply(replyText);

  } catch (e) {
    console.error(e);
    await m.reply(`An error occurred during upload: ${e.message}`);
  } finally {
    // IMPORTANT: Clean up by deleting the temporary file
    if (fs.existsSync(tmpFilePath)) {
      await fs.promises.unlink(tmpFilePath);
    }
  }
};

// --- Handler Configuration ---
handler.help = ['upload'];
handler.command = ['upload'];
handler.tags = ['uploader']; 
export default handler;
