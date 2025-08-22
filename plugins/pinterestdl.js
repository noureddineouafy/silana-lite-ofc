import cheerio from 'cheerio';
import fetch from 'node-fetch';

/** plugin by noureddine_ouafy 
AUTHOR: YUDZXML STORE 77
 NAME: PINTEREST DOWNLOADER
 BASE: https://www.expertstool.com/download-pinterest-video/
 DESC: SUPP IMAGE DAN VIDEO 
 SALURAN: https://whatsapp.com/channel/0029Vb6ZuHK3LdQSvWGxhr39
 CREATE: 21 AGUSTUS 2025
 NOTE: DONT DELETE WM 
**/

async function pindl(pinUrl) {
  try {
    const initRes = await fetch("https://www.expertstool.com/download-pinterest-video/");
    const setCookie = initRes.headers.get("set-cookie");
    if (!setCookie) throw new Error("Cookie not found.");

    const response = await fetch("https://www.expertstool.com/download-pinterest-video/", {
      method: "POST",
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": setCookie,
        "Referer": "https://www.expertstool.com/download-pinterest-video/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      body: new URLSearchParams({ url: pinUrl })
    });

    if (!response.ok) throw new Error("Failed to get a response from the API.");

    const html = await response.text();
    const $ = cheerio.load(html);
    const downloadLink = $("a[download]").attr("href") || "";

    if (!downloadLink) throw new Error("Download link not found on the page.");

    return { status: 200, url: downloadLink };
  } catch (error) {
    console.error("Fetch failed.", error.message);
    return null;
  }
}

// Handler integration
let handler = async (m, { conn, text, usedPrefix, command }) => {
    // Check if the user provided a URL
    if (!text) {
        return m.reply(`Please provide a Pinterest URL.\n\n*Example:* ${usedPrefix + command} https://pin.it/3zLASkjBA`);
    }

    // Validate the URL
    if (!text.match(/https?:\/\/(www\.)?pinterest\.com\/.+|https?:\/\/pin\.it\/.+/)) {
        return m.reply('Please provide a valid Pinterest URL.');
    }
    
    await m.reply('⏳ Please wait, processing...');

    try {
        // Call the scraping function
        const result = await pindl(text);

        // Check if the result is valid and has a URL
        if (result && result.url) {
            // Send the file to the user
            await conn.sendFile(m.chat, result.url, 'pinterest.mp4', `*Downloaded successfully!* ✨`, m);
        } else {
            // Handle failure
            await m.reply('❌ Failed to download the content. The link might be invalid or private.');
        }
    } catch (e) {
        console.error(e);
        await m.reply('An error occurred while processing your request.');
    }
};

// Handler metadata
handler.help = ['pinterestdl'];
handler.command = ['pinterestdl'];
handler.tags = ['downloader'];
handler.limit = true; 
export default handler;
