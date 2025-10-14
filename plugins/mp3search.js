// instagram.com/noureddine_ouafy
// scrape by synshin9
import axios from "axios";
import * as cheerio from "cheerio";

class MP3Scraper {
  constructor() {
    this.headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:108.0) Gecko/20100101 Firefox/108.0",
    };
  }

  async search(query) {
    try {
      const apiUrl = "https://mp3.pm/public/api.search.php";

      const res = await axios.post(
        apiUrl,
        new URLSearchParams({ q: query }).toString(),
        {
          headers: {
            ...this.headers,
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
        }
      );

      const slugUrl = res.data;
      if (typeof slugUrl !== "string") {
        console.warn("Unexpected API response:", slugUrl);
        return [];
      }

      const page = await axios.get(slugUrl, { headers: this.headers });
      return this.parseResults(page.data);
    } catch (err) {
      console.error("Error searching:", err.message);
      return [];
    }
  }

  parseResults(html) {
    const $ = cheerio.load(html);
    const results = [];

    $(".cplayer-sound-item").each((i, el) => {
      const $el = $(el);
      const author = $el.find(".cplayer-data-sound-author").text().trim();
      const title = $el.find(".cplayer-data-sound-title").text().trim();
      const duration = $el.find(".cplayer-data-sound-time").text().trim();
      const downloadUrl = $el.attr("data-sound-url");
      const shareUrl = $el.attr("data-share-url");

      if (title && author && downloadUrl) {
        results.push({
          title,
          author,
          duration,
          downloadUrl,
          shareUrl,
        });
      }
    });

    return results;
  }
}

const handler = async (m, { conn, text }) => {
  if (!text)
    return m.reply(
      `🎵 *MP3 Search Feature*\n\nUse this command to search for free MP3 music.\n\nExample:\n.mp3search Alan Walker`
    );

  m.reply(
    "🔍 Please wait a moment...\nFetching MP3 results from mp3.pm 🎧"
  );

  try {
    const scraper = new MP3Scraper();
    const results = await scraper.search(text);

    if (!results || results.length === 0)
      return m.reply("⚠️ No results found. Try another keyword.");

    const limited = results.slice(0, 5);
    let msg = `🎶 *Search results for:* ${text}\n\n`;

    for (let i = 0; i < limited.length; i++) {
      const r = limited[i];
      msg += `🎵 *${r.title}*\n👤 Artist: ${r.author}\n⏱️ Duration: ${r.duration}\n⬇️ Download: ${r.downloadUrl}\n🔗 Share: ${r.shareUrl}\n\n`;
    }

    await m.reply(msg);

    // Auto send the first MP3 result
    const first = limited[0];
    if (first && first.downloadUrl) {
      await conn.sendFile(
        m.chat,
        first.downloadUrl,
        `${first.title}.mp3`,
        `🎧 *${first.title}* - ${first.author}`,
        m
      );
    }
  } catch (err) {
    console.error(err);
    m.reply("❌ Error while searching for music.");
  }
};

handler.help = ["mp3search"];
handler.tags = ["downloader"];
handler.command = ["mp3search", "mp3pm"];

export default handler;
