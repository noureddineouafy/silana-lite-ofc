// plugin by noureddine Ouafy 
// scrape by Yanz

import axios from "axios";
import cheerio from "cheerio";

// The scraping logic is moved into its own async function for cleanliness.
const scrapeInstagram = async (url) => {
  return new Promise(async (resolve, reject) => {
    try {
      // The scraper targets a third-party download site to get the media links.
      const { data } = await axios.get(
        `https://insta-save.net/content.php?url=${encodeURIComponent(url)}`,
        {
          headers: {
            "accept": "*/*",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
          },
        }
      );

      // Cheerio is used to parse the HTML response and find the data.
      const $ = cheerio.load(data.html);
      const results = [];

      // Iterates through each content container found on the page.
      $("#download_content .col-md-4.position-relative").each((index, element) => {
        const el = $(element);
        
        // Extracts all relevant data points for each media item.
        const downloadLink = el.find("a.btn.bg-gradient-success").attr("href") || "";
        const imgSrc = el.find("img.load").attr("src") || el.find("img").attr("src") || "";
        const description = el.find("p.text-sm").text().trim() || "No caption";
        const profileName = el.find("p.text-sm a").text().trim() || "Unknown";
        const stats = el.find(".stats small").toArray().map((s) => $(s).text().trim());
        const likes = stats[0] || "0";
        const comments = stats[1] || "0";

        // Ensures that a valid download link was found before adding to results.
        if (downloadLink) {
          results.push({
            downloadLink,
            imgSrc,
            description,
            profileName,
            likes,
            comments,
          });
        }
      });

      resolve(results);
    } catch (error) {
      console.error("Scraper Error:", error);
      reject(new Error("Failed to scrape content. The post may be private or the URL is invalid."));
    }
  });
};

// This is the main handler function that the bot will execute.
let handler = async (m, { conn, args, usedPrefix, command }) => {
  // 1. Validate user input
  if (!args[0]) {
    throw `Please provide an Instagram post URL. 🔗\n\n*Example:*\n${usedPrefix + command} https://www.instagram.com/p/C...`;
  }
  if (!args[0].match(/instagram\.com\/(p|reel|tv)\//)) {
    throw "That doesn't look like a valid Instagram post URL. Please check the link and try again.";
  }

  try {
    // 2. Inform the user and start scraping
    await m.reply("⏳ Fetching content, please wait...");
    
    const results = await scrapeInstagram(args[0]);

    if (!results || results.length === 0) {
      throw "Couldn't find any downloadable content. The post might be private or deleted.";
    }

    // 3. Send the scraped content back to the user
    for (const item of results) {
      const caption = `
👤 *By:* ${item.profileName}
❤️ *Likes:* ${item.likes}
💬 *Comments:* ${item.comments}

*Caption:* ${item.description}
      `.trim();
      
      // The 'conn.sendFile' function sends the media using the direct download link.
      await conn.sendFile(m.chat, item.downloadLink, "instagram.mp4", caption, m);
    }
  } catch (error) {
    console.error(error);
    m.reply(`⚠️ Oops! Something went wrong.\n*Error:* ${error.message}`);
  }
};

// Handler configuration
handler.help = ["insta-save"];
handler.command = ["insta-save"];
handler.tags = ["downloader"];
handler.limit = true; // Enables usage limit for this command

export default handler;
