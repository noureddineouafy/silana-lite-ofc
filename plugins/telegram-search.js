
/**
 * Telegram Channel Search Plugin
 * Author: gienetic
 * Base: https://tgramsearch.com/
 * Plugin Conversion: By noureddine ouafy using Gemini 
 */


import axios from "axios";
import cheerio from "cheerio";


// Helper function to get the real t.me link from a join page
async function getRealTelegramLink(joinUrl) {
  try {
    const { data } = await axios.get(joinUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
      },
    });
    const $ = cheerio.load(data);
    const realLink = $('a[href^="tg://resolve"]').attr("href");

    if (realLink) {
      const username = realLink.split("tg://resolve?domain=")[1];
      return `https://t.me/${username}`;
    }
  } catch (e) {
    // Silently fail and fallback to the original URL
    console.error(`Failed to resolve Telegram link: ${e.message}`);
  }
  return joinUrl;
}

// Main function to search for Telegram channels
async function searchTelegramChannels(query) {
  try {
    const url = `https://en.tgramsearch.com/search?query=${encodeURIComponent(
      query,
    )}`;
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
      },
    });

    const $ = cheerio.load(data);
    const results = [];

    for (const el of $(".tg-channel-wrapper").toArray()) {
      const name = $(el).find(".tg-channel-link a").text().trim();
      let link = $(el).find(".tg-channel-link a").attr("href");
      const image = $(el).find(".tg-channel-img img").attr("src");
      const members = $(el).find(".tg-user-count").text().trim();
      const description = $(el).find(".tg-channel-description").text().trim();
      const category = $(el).find(".tg-channel-categories a").text().trim();

      if (link?.startsWith("/join/")) {
        link = await getRealTelegramLink(`https://en.tgramsearch.com${link}`);
      } else if (link?.startsWith("tg://resolve?domain=")) {
        const username = link.split("tg://resolve?domain=")[1];
        link = `https://t.me/${username}`;
      }

      results.push({ name, link, image, members, description, category });
    }
    return results;
  } catch (err) {
    console.error(`Telegram Search Scraping Error: ${err.message}`);
    throw new Error("Could not fetch data from the source.");
  }
}

// --- Plugin Handler ---
const handler = async (m, { text, usedPrefix, command }) => {
  if (!text) {
    throw `Please provide a search query.\n\n*Example:* ${usedPrefix}${command} android`;
  }

  await m.reply("Searching for channels, please wait... 🕵️");

  try {
    const results = await searchTelegramChannels(text);

    if (results.length === 0) {
      return m.reply(`😔 No channels found for "*${text}*".`);
    }

    let replyText = `✅ *Found ${results.length} channels for "${text}"*\n\n`;
    replyText += results
      .map((item, i) => {
        return `*${i + 1}. ${item.name}*
👥 *Members:* ${item.members || "N/A"}
🏷️ *Category:* ${item.category || "N/A"}
🔗 *Link:* ${item.link || "N/A"}
📝 *Description:* ${item.description || "No description."}`;
      })
      .join("\n\n---\n\n");

    await m.reply(replyText);
  } catch (e) {
    console.error(e);
    await m.reply(`An error occurred: ${e.message}`);
  }
};

handler.help = ["telegram-search"];
handler.command = ["telegram-search"];
handler.tags = ["search"];
handler.limit = true;
export default handler;
