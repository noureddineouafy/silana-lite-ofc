/* TOURL translated by noureddine ouafy
Feature : TOURL supports image, video, and other files
Base : https://cdn.ypnk.biz.id/
Description : No expiration or time limit
Feature Group : https://chat.whatsapp.com/DUWddjCXWv4CCoeS8uP2lP
Channel : https://whatsapp.com/channel/0029VbA8pjlIN9isK6uO650c
Note : We are looking for competent admins to share experience and features, this is free. You can chat at wa.me/6285134816783 ( Naufal YP ) 
*/
import axios from 'axios';
import FormData from 'form-data';
import { fileTypeFromBuffer } from 'file-type';

const uploadFile = async (buffer, filename) => {
  const form = new FormData();
  form.append('files', buffer, { filename });

  const response = await axios.post('https://cdn.ypnk.biz.id/upload', form, {
    headers: {
      ...form.getHeaders(),
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
    },
    timeout: 120000
  });

  return response.data;
};

const handler = async (m, { conn, usedPrefix, command }) => {
  try {
    const quoted = m.quoted ? m.quoted : m;
    const mime = (quoted?.msg || quoted)?.mimetype || '';

    if (!quoted || !mime || mime.includes('text/plain') || !quoted.download) {
      return conn.sendMessage(m.chat, {
        text: `❌ Reply to a file with *${usedPrefix + command}*\n\n✅ Supported: Images, Videos, Audio, Documents (not plain text)`
      }, { quoted: m });
    }

    await conn.sendMessage(m.chat, {
      react: { text: '⏳', key: m.key }
    });

    const media = await quoted.download();
    
    if (!media || media.length === 0) {
      throw new Error('Failed to download file');
    }

    if (media.length > 100 * 1024 * 1024) {
      throw new Error('File too large (max 100MB)');
    }

    const type = await fileTypeFromBuffer(media).catch(() => null);
    let ext = type?.ext;
    
    if (!ext && mime) {
      const mimeMap = {
        'application/javascript': 'js',
        'text/javascript': 'js',
        'application/json': 'json',
        'text/html': 'html',
        'text/css': 'css',
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'video/mp4': 'mp4',
        'audio/mpeg': 'mp3'
      };
      ext = mimeMap[mime];
    }
    
    if (!ext && mime) {
      const fallback = mime.split('/')[1];
      if (fallback && fallback.length <= 4 && !fallback.includes('-')) {
        ext = fallback;
      }
    }

    const filename = `file_${Date.now()}${ext ? '.' + ext : ''}`;

    const result = await uploadFile(media, filename);

    if (result.success && result.files?.[0]) {
      const file = result.files[0];
      const fileUrl = `https://cdn.ypnk.biz.id${file.url}`;

      await conn.sendMessage(m.chat, {
        text: `✅ *Upload Successful!*\n\n📎 *URL:* ${fileUrl}\n📊 *Size:* ${file.size}`
      }, { quoted: m });
    } else {
      throw new Error('Upload failed');
    }

  } catch (error) {
    await conn.sendMessage(m.chat, {
      react: { text: '❌', key: m.key }
    });

    let msg = 'Upload failed';
    if (error.message.includes('download')) msg = 'Cannot download file';
    else if (error.message.includes('large')) msg = 'File too large (max 100MB)';
    else if (error.response?.status === 413) msg = 'File too large';
    else if (error.response?.status === 500) msg = 'Server error, try again later';

    await conn.sendMessage(m.chat, {
      text: `❌ ${msg}`
    }, { quoted: m });
  }
};

handler.help = ['cdn.ypnk'];
handler.tags = ['uploader'];
handler.command = /^(cdn.ypnk)$/i;
handler.limit = true;

export default handler;
