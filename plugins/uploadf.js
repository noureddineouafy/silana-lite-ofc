// plugin by noureddine ouafy 
// scrape by rizki

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

// ─────────────────────────────────────────────
//  GUIDE
//  Feature  : File Uploader via uploadf.com
//  Command  : .upload (reply or attach a file/image)
//  Usage    : Reply to any media message with .upload
//             The bot will download the file and upload
//             it to uploadf.com, then return a public link.
// ─────────────────────────────────────────────

let handler = async (m, { conn }) => {

  // 1. Must be a quoted/replied message with media
  const quoted = m.quoted;
  if (!quoted || !quoted.download) {
    return conn.reply(
      m.chat,
      `❌ *No media detected!*\n\nPlease *reply to a file or image* with the command *.upload*\n\n📌 *Example usage:*\n> Reply to an image → *.upload*`,
      m
    );
  }

  await conn.reply(m.chat, '⏳ *Uploading your file, please wait...*', m);

  try {
    // 2. Download the media buffer from the quoted message
    const buffer = await quoted.download();
    const mimeType = quoted.mimetype || 'application/octet-stream';
    const extension = mimeType.split('/')[1]?.split(';')[0] || 'bin';
    const fileName = quoted.filename || `upload_${Date.now()}.${extension}`;

    // 3. Write buffer to a temp file
    const tempPath = `/tmp/${fileName}`;
    fs.writeFileSync(tempPath, buffer);

    // 4. Build FormData and set headers
    const formData = new FormData();
    formData.append('file', fs.createReadStream(tempPath));

    const headers = {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Accept-Language': 'en-US,en;q=0.9',
      'Origin': 'https://uploadf.com',
      'Referer': 'https://uploadf.com/id/',
      'X-Requested-With': 'XMLHttpRequest',
      ...formData.getHeaders()
    };

    // 5. POST to uploadf.com
    const response = await axios.post('https://uploadf.com/fileup.php', formData, { headers });
    const data = response.data;

    // 6. Clean up temp file
    fs.unlinkSync(tempPath);

    // 7. Check response
    if (!data.FLG || !data.NAME) {
      throw new Error('Upload failed — no file link returned from server.');
    }

    const uploadedUrl = `https://uploadf.com/s/${data.NAME}`;
    const originalName = data.NRF || fileName;

    // 8. Reply with the result
    const resultMsg =
      `✅ *File Uploaded Successfully!*\n\n` +
      `📁 *File Name:* ${originalName}\n` +
      `🔗 *Download Link:*\n${uploadedUrl}\n\n` +
      `_Powered by uploadf.com_`;

    await conn.reply(m.chat, resultMsg, m);

  } catch (err) {
    console.error('[upload handler error]', err.message);
    await conn.reply(
      m.chat,
      `❌ *Upload failed!*\n\n${err.message}\n\nPlease try again later.`,
      m
    );
  }
};

// ── Handler metadata ──────────────────────────
handler.help    = ['uploadf'];
handler.command = ['uploadf'];
handler.tags    = ['tools'];
handler.limit   = true;

export default handler;
