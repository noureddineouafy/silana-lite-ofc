/*
All In One - Uploader
- Auto Update
*/

import axios from "axios";
import FormData from "form-data";
import fs from "fs";

let handler = async (m, { conn, text, usedPrefix, command }) => {
  let q = m.quoted ? m.quoted : m;
  let mime = (q.msg || q).mimetype || '';

  // Get the list of available uploaders
  let { data: list } = await axios.get("https://r-nozawa-uploader.hf.space/list");

  // Instructions and uploader options
  let capt = 'Send or reply to a media file\n\nAvailable uploader options:\n';
  capt += list.map((item, index) => `${index + 1}. ${item}`).join('\n');
  capt += `\n\nExample: *${usedPrefix + command} 1*`;

  if (!text || !mime) return m.reply(capt);

  if (text >= 1 && text <= list.length) {
    let type = list[text - 1];
    try {
      m.react("⛅");
      let result = await upload(await q.download(true), type);
      result = Object.entries(result).map(([key, val]) => `*${key}*: ${val}`).join('\n');
      m.reply(result);
    } catch (e) {
      m.reply("An error occurred: " + e.message);
    }
  } else {
    return m.reply("Invalid selection");
  }
};

handler.help = ["aioupload"];
handler.tags = ["uploader"];
handler.command = /^(aioupload)$/i;
handler.limit = true 
export default handler;

async function upload(path, type) {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(path));
    form.append('uploader', type);

    const response = await axios.post(`https://r-nozawa-uploader.hf.space/`, form, {
      headers: form.getHeaders()
    });

    return response.data;
  } catch (err) {
    return err.response?.data || err.message;
  }
}
