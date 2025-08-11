import axios from "axios";
import cheerio from "cheerio";

/**
 * WhatsApp Group Search Plugin
 * Author: gienetic
 * Base: https://whatsgrouplink.com/
 * Plugin Conversion & Logic Improvement: Gemini
 * and also noureddine ouafy 
 */

/**
 * Step 1: Find articles based on a search query.
 * @param {string} query - The search keyword.
 * @returns {Promise<Array<{ title: string, url: string }>>} A list of found articles.
 */
async function fetchSearchResults(query) {
  try {
    const searchUrl = `https://whatsgrouplink.com/?s=${encodeURIComponent(query)}`;
    const { data } = await axios.get(searchUrl, { timeout: 15000 });
    const $ = cheerio.load(data);
    const results = [];

    $("article").each((_, el) => {
      const title = $(el).find(".entry-title a").text().trim();
      const url = $(el).find(".entry-title a").attr("href");
      if (title && url) {
        results.push({ title, url });
      }
    });
    return results;
  } catch (error) {
    console.error("Search Error:", error.message);
    throw new Error("Failed to search for articles. The site might be down.");
  }
}

/**
 * Step 2: Extract the actual WhatsApp group links from an article's URL.
 * @param {string} url - The URL of the article.
 * @returns {Promise<string>} A formatted string of group names and links.
 */
async function fetchGroupLinks(url) {
  try {
    const { data } = await axios.get(url, { timeout: 15000 });
    const $ = cheerio.load(data);
    const groups = [];

    // Selects list items containing a WhatsApp chat link
    $('ul.wp-block-list li a[href*="chat.whatsapp.com"]').each((i, el) => {
      const linkElement = $(el);
      const listItem = linkElement.parent();
      const href = linkElement.attr("href");
      // Cleans up the text to get a clean group name
      const name = listItem.text().replace(linkElement.text(), "").replace(/[-:]/g, "").trim();
      
      groups.push(`${i + 1}. ${name || "WhatsApp Group"}\n   - Link: ${href}`);
    });

    return groups.length > 0
      ? groups.join("\n\n")
      : "No valid WhatsApp group links were found on this page. 😔";
  } catch (error) {
    console.error("Group Fetch Error:", error.message);
    throw new Error("Failed to process the group page.");
  }
}

// --- Plugin Handler ---
const handler = async (m, { text, usedPrefix, command }) => {
  if (!text) {
    throw `Please provide a search query.\n\n*Example:* ${usedPrefix}${command} gaming`;
  }

  await m.reply("Searching for WhatsApp groups... 📲");

  try {
    // Step 1: Find the list of articles.
    const articles = await fetchSearchResults(text);
    if (articles.length === 0) {
      return m.reply(`Couldn't find any articles related to "*${text}*". Try a different keyword.`);
    }

    // Automatically pick the first (most relevant) article.
    const firstArticle = articles[0];
    await m.reply(`Found article: *"${firstArticle.title}"*. Now fetching group links...`);

    // Step 2: Extract group links from that article.
    const groupLinks = await fetchGroupLinks(firstArticle.url);
    
    // Step 3: Send the final results.
    const finalMessage = `
*Source Article:*
${firstArticle.title}

*🔗 Available Groups:*
---------------------
${groupLinks}
    `.trim();

    await m.reply(finalMessage);

  } catch (error) {
    console.error(error);
    m.reply(`An error occurred: ${error.message}`);
  }
};

handler.help = ["whatsgrouplink"];
handler.command = ["whatsgrouplink"];
handler.tags = ["search"];
handler.limit = true;

export default handler;
