
import * as cheerio from "cheerio";

async function downloadTwitterMedia(q) {
  let t = await fetch("https://x2twitter.com/api/userverify", {
    method: "POST",
    body: new URLSearchParams({ url: q })
  }).then(r => r.json()).then(r => r.token);

  let html = await fetch("https://x2twitter.com/api/ajaxSearch", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8"
    },
    body: new URLSearchParams({ q, lang: "en", cftoken: t })
  }).then(r => r.json()).then(r => r.data);

  let $ = cheerio.load(html);

  let videos = $("a.tw-button-dl")
    .map((_, el) => {
      let text = $(el).text();
      let url = $(el).attr("href");
      let quality = parseInt(text.match(/\((\d+)p\)/)?.[1] || 0);
      return { url, quality };
    })
    .get()
    .filter(v => v.url && v.quality)
    .sort((a, b) => b.quality - a.quality);

  if (videos.length) return { type: "video", url: videos[0].url };

  let images = $("ul.download-box a")
    .map((_, el) => $(el).attr("href"))
    .get()
    .filter(Boolean);

  return { type: "image", urls: images };
}

// ─────────────────────────────────────────────
// GUIDE:
// Command : .twitter <tweet_url>
// Feature : Downloads the highest quality video or
//           all images from any public X (Twitter) post.
// Usage   : .twitter https://x.com/i/status/123456789
// Notes   : - Only public posts are supported.
//           - Videos are sent in the highest available resolution.
//           - Image posts may contain multiple images (sent as a batch).
//           - Reels/Spaces and private accounts are NOT supported.
// ─────────────────────────────────────────────

let handler = async (m, { conn }) => {
  const args = m.text.trim().split(/\s+/);
  const url  = args[1];

  // ── No URL provided → show guide ──────────────────────────────────
  if (!url) {
    return conn.sendMessage(m.chat, {
      text:
`╔══════════════════════════════╗
║   🐦  Twitter / X Downloader  ║
╚══════════════════════════════╝

📌 *What is this?*
This command lets you download videos or images from any public X (Twitter) post — at the best available quality.

📖 *How to use:*
  .twitter <tweet_url>

💡 *Example:*
  .twitter https://x.com/i/status/2039329003614720287

✅ *Supported:*
  • Public video tweets  (highest resolution)
  • Public image tweets  (all images)

❌ *Not supported:*
  • Private / protected accounts
  • Twitter Spaces or live streams
  • Tweets with no media`
    }, { quoted: m });
  }

  // ── Basic URL validation ───────────────────────────────────────────
  if (!/^https?:\/\/(x|twitter)\.com\//i.test(url)) {
    return conn.sendMessage(m.chat, {
      text: '❌ Invalid URL.\nPlease provide a valid X / Twitter link.\n\nExample:\n.twitter https://x.com/i/status/123456789'
    }, { quoted: m });
  }

  // ── Let the user know we are working on it ─────────────────────────
  await conn.sendMessage(m.chat, { text: '⏳ Fetching media, please wait...' }, { quoted: m });

  try {
    const result = await downloadTwitterMedia(url);

    // ── Video ──────────────────────────────────────────────────────
    if (result.type === 'video') {
      await conn.sendMessage(m.chat, {
        video: { url: result.url },
        caption: '✅ Here is your video!'
      }, { quoted: m });

    // ── Images ─────────────────────────────────────────────────────
    } else if (result.type === 'image' && result.urls?.length) {
      for (const imgUrl of result.urls) {
        await conn.sendMessage(m.chat, {
          image: { url: imgUrl },
          caption: `🖼️ Image ${result.urls.indexOf(imgUrl) + 1} of ${result.urls.length}`
        }, { quoted: m });
      }

    // ── No media found ─────────────────────────────────────────────
    } else {
      await conn.sendMessage(m.chat, {
        text: '⚠️ No downloadable media found in that tweet.\nMake sure the post is public and contains a video or image.'
      }, { quoted: m });
    }

  } catch (err) {
    console.error('[twitter-dl error]', err);
    await conn.sendMessage(m.chat, {
      text: '❌ Something went wrong while fetching the media.\nPlease try again later or check if the tweet is public.'
    }, { quoted: m });
  }
};

// ── Handler metadata ───────────────────────────────────────────────────
handler.help    = ['twitter'];
handler.command = ['twitter'];
handler.tags    = ['downloader'];
handler.limit   = true;

export default handler;
