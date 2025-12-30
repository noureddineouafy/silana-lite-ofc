// plugin by sc Kashiwada-MultiDevice 
// modified by me instagram.com/noureddine_ouafy

import axios from "axios";

function extractId(url) {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    const id = parts.pop();
    return id || null;
  } catch (e) {
    return null;
  }
}

let handler = async (m, { conn, text }) => {
  try {
    if (!text) return m.reply(`⚠️ Please insert a **GitHub Gist URL**

📌 Example:
• .gits https://gist.github.com/manzxy/2b50c4f57cbbe91199d1d640d7ea4a99
• .gits https://gist.github.com/username/gistID
• .gits https://gist.github.com/username/gistID --doc

🛠️ Feature Explanation:
This command allows you to extract code from a **GitHub Gist** link.
You can receive the content either as:
- normal text reply (default)
- a file/document (use --doc)`);
    
    let [link, type] = text.split(" ");

    if (!link.includes("github")) return m.reply("⚠️ That is not a valid GitHub Gist link!");

    const id = extractId(link);
    let raw = (await axios.get(`https://api.github.com/gists/${id}`)).data;
    let files = Object.values(raw?.files || []);

    for (let file of files) {
      if (type?.toLowerCase() === "--doc") {
        const buffer = Buffer.from(file.content, "utf-8");
        await conn.sendMessage(
          m.chat,
          {
            document: buffer,
            fileName: file.filename,
            mimetype: file.type
          },
          { quoted: m }
        );
      } else {
        await m.reply(file.content);
      }
    }

  } catch (e) {
    m.reply("❌ Error — something went wrong or too many requests.\nPlease try again later.");
    console.error(e);
  }
};

handler.help = handler.command = ['gits', 'getgits'];
handler.tags = ['tools'];
handler.limit = true;

export default handler;
