// instagram.com/noureddine_ouafy
// scrape by @zaenal-iyyl
import axios from "axios";
import cheerio from "cheerio";

async function igram(url) {
  try {
    const encoded = encodeURIComponent(url);
    const res = await axios.get("https://igram.website/content.php?url=" + encoded, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
      }
    });

    const json = res.data;
    if (!json.html) throw new Error("Empty HTML or invalid URL");

    const $ = cheerio.load(json.html);
    const thumb = $("img.w-100").attr("src");
    const caption = $("p.text-sm").text().trim();
    const download = $('a:contains("Download HD")').attr("href");
    const user = json.username || "unknown";

    return { user, thumb, caption, download };
  } catch (error) {
    console.error("Error scraping Instagram:", error.message);
    throw error;
  }
}

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply("Please provide an Instagram link.");

  await m.reply("المرجو الانتظار قليلا لا تنسى ان تتابع \ninstagram.com/noureddine_ouafy");

  try {
    const result = await igram(text);

    if (!result.download) {
      return m.reply("⚠️ Could not find a downloadable video from that URL.");
    }

    const caption = `📸 *Instagram Downloader*  
👤 User: ${result.user}  
📝 Caption: ${result.caption || "No caption"}  
🔗 Downloading video...`;

    await conn.sendMessage(m.chat, {
      video: { url: result.download },
      caption
    }, { quoted: m });

  } catch (error) {
    console.error(error);
    await m.reply("❌ Failed to download Instagram video. Please try again later.");
  }
};

handler.help = handler.command = ["ig-video"];
handler.tags = ["downloader"];
handler.limit = true;

export default handler;
