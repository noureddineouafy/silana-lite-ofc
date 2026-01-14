/*• Feature Name: Tourl
• Type: Plugin ESM
• Channel Link: https://whatsapp.com/channel/0029VbB8WYS4CrfhJCelw33j
• Author: Agas
°° modified by instagram.com/noureddine_ouafy
*/

import crypto from "crypto";
import { FormData, Blob } from "formdata-node";
import { fileTypeFromBuffer } from "file-type";
import axios from "axios";

const handler = async (m, { conn }) => {
  const q = m.quoted ? m.quoted : m;
  const mime = (q.msg || q).mimetype || "";
  if (!mime) return m.reply("❌ No media found!");

  await conn.sendMessage(m.chat, { react: { text: "🍁️", key: m.key } });

  const media = await q.download();
  if (media.length > 50 * 1024 * 1024)
    return m.reply("❌ File too large! Maximum is 50 MB.");

  const ft = (await fileTypeFromBuffer(media)) || {
    ext: "bin",
    mime: "application/octet-stream",
  };

  try {
    const link = await uploadDeline(media, ft.ext, ft.mime);
    const caption = `📤 *T O F I L E L I N K*\n
📦 *Size:* ${formatBytes(media.length)}
📁 *Type:* ${ft.mime} (.${ft.ext})
🔗 *Link:* ${link}`;

    await conn.sendMessage(m.chat, { text: caption }, { quoted: m });
  } catch (e) {
    await m.reply(`❌ *Upload failed*\n${e?.message || e}`);
  }
};

handler.command = ["filetolink"]; // changed command
handler.help = ["filetolink"];
handler.tags = ["uploader"];
export default handler;

async function uploadDeline(buffer, ext = "bin", mime = "application/octet-stream") {
  const fd = new FormData();
  const name = `${crypto.randomBytes(5).toString("hex")}.${ext}`;
  fd.append("file", new Blob([buffer], { type: mime }), name);

  const res = await axios.post("https://api.deline.web.id/uploader", fd, {
    maxBodyLength: 50 * 1024 * 1024,
    maxContentLength: 50 * 1024 * 1024,
  });

  const data = res.data || {};
  if (data.status === false)
    throw new Error(data.message || data.error || "Upload failed");

  const link = data?.result?.link || data?.url || data?.path;
  if (!link) throw new Error("Invalid response (no link found)");
  return link;
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(2)} ${units[i]}`;
}
