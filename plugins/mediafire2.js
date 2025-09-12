// instagram.com/noureddine_ouafy
// Plugin: Mediafire Downloader (send file directly if size < 500 MB)
// scrape by malik
import axios from "axios";

class MFDownloader {
  constructor() {
    this.api = "https://www.mediafire.com/api/1.4";
  }

  async fetch({ url }) {
    if (!url.includes("mediafire.com")) throw new Error("Invalid Mediafire URL");

    const fileMatch = url.match(/mediafire\.com\/file\/([a-z0-9]+)/i);
    if (fileMatch) return await this.getFileInfo(fileMatch[1]);

    const folderMatch = url.match(/mediafire\.com\/folder\/([a-z0-9]+)/i);
    if (folderMatch) return await this.getFolderContent(folderMatch[1]);

    throw new Error("URL not recognized as file or folder");
  }

  async getFileInfo(quickKey) {
    const { data } = await axios.get(`${this.api}/file/get_info.php`, {
      params: {
        quick_key: quickKey,
        response_format: "json"
      }
    });
    const info = data?.response?.file_info;
    if (!info || info.ready !== "yes") throw new Error("File not available");
    return {
      type: "file",
      name: info.filename,
      size: +info.size,
      mimetype: info.mimetype,
      created: info.created,
      download: info.links.normal_download
    };
  }

  async getFolderContent(folderKey) {
    const { data } = await axios.get(`${this.api}/folder/get_content.php`, {
      params: {
        folder_key: folderKey,
        response_format: "json",
        content_type: "files",
        filter: "all",
        order_by: "name",
        order_direction: "asc",
        chunk: 1,
        version: "1.5",
        r: Math.random().toString(36).slice(2)
      }
    });
    const files = data?.response?.folder_content?.files || [];
    return {
      type: "folder",
      total: files.length,
      files: files.map(f => ({
        name: f.filename,
        size: +f.size,
        mimetype: f.mimetype,
        created: f.created,
        download: f.links.normal_download
      }))
    };
  }
}

let handler = async (m, { conn, args }) => {
  if (!args[0]) return m.reply("Please provide a Mediafire link");

  try {
    const mf = new MFDownloader();
    const result = await mf.fetch({ url: args[0] });

    if (result.type === "file") {
      // إذا الحجم أقل من 500MB نحمل الملف ونرسلو مباشرة
      if (result.size < 500 * 1024 * 1024) {
        await conn.sendMessage(m.chat, {
          document: { url: result.download },
          mimetype: result.mimetype,
          fileName: result.name
        }, { quoted: m });
      } else {
        // إذا الحجم كبير بزاف غير نرسل المعلومات + الرابط
        await conn.sendMessage(m.chat, {
          text: `📂 *File Found*\n\n*Name:* ${result.name}\n*Size:* ${result.size} bytes\n*MIME:* ${result.mimetype}\n*Created:* ${result.created}\n\n🔗 *Download:* ${result.download}`
        }, { quoted: m });
      }
    } else {
      let msg = `📁 *Folder Content* (Total: ${result.total})\n\n`;
      msg += result.files.map((f, i) =>
        `*${i + 1}.* ${f.name}\nSize: ${f.size} bytes\nDownload: ${f.download}\n`
      ).join("\n\n");

      await conn.sendMessage(m.chat, { text: msg }, { quoted: m });
    }
  } catch (e) {
    m.reply("❌ Error: " + e.message);
  }
};

handler.help = ["mediafire2"];
handler.tags = ["downloader"];
handler.command = ["mediafire2"];
handler.limit = true;

export default handler;
