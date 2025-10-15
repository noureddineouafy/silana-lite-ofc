// instagram.com/noureddine_ouafy
// 📦 Mediafire Downloader Plugin — Silana Bot

import * as cheerio from "cheerio";
import { basename, extname } from "path";
import fetch from "node-fetch";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function mediafire(url) {
  const html = await (await fetch(url.trim())).text();
  const $ = cheerio.load(html);

  const title = $("meta[property='og:title']").attr("content")?.trim() || "Unknown";
  const size =
    /Download\s*\(([\d.]+\s*[KMGT]?B)\)/i.exec($.html())?.[1] || "Unknown";
  const dl =
    $("a.popsok[href^='https://download']").attr("href")?.trim() ||
    $("a.popsok:not([href^='javascript'])").attr("href")?.trim() ||
    (() => {
      throw new Error("Download URL not found.");
    })();

  return {
    name: title,
    filename: basename(dl),
    type: extname(dl),
    size,
    download: dl,
    link: url.trim(),
  };
}

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply("Please provide a Mediafire link.\nExample: *.mediafire https://www.mediafire.com/file/...*");

  m.reply("⏳ Please wait, downloading your file...\n\nDon't forget to follow: instagram.com/noureddine_ouafy");

  try {
    const data = await mediafire(text);

    const res = await fetch(data.download);
    if (!res.ok) throw new Error("Failed to fetch file.");

    const filePath = `${__dirname}/${data.filename}`;
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buffer));

    await conn.sendMessage(m.chat, {
      document: fs.readFileSync(filePath),
      fileName: data.name,
      mimetype: "application/octet-stream",
      caption: `
📦 *MEDIAFIRE DOWNLOADER*

📄 *File Name:* ${data.name}
📁 *File Type:* ${data.type}
📏 *File Size:* ${data.size}
🔗 *Source Link:* ${data.link}

✅ File sent successfully!
© instagram.com/noureddine_ouafy
      `,
    }, { quoted: m });

    fs.unlinkSync(filePath); // clean up after sending
  } catch (e) {
    console.error(e);
    m.reply("❌ Failed to download or send the file.\nPlease check the Mediafire link and try again.");
  }
};

handler.help = ["mediafire2"];
handler.tags = ["downloader"];
handler.command = ["mediafire2"];
handler.limit = true;

export default handler;
