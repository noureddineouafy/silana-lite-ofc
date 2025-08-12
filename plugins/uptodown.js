import axios from "axios";
import cheerio from "cheerio";

/**
 * Scraper function for Uptodown
 * @param {string} url - The Uptodown URL to scrape.
 * @returns {Promise<object>} - The scraped data or an error object.
 */
async function uptodown(url) {
  try {
    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Safari/537.36"
      }
    });
 
    const $ = cheerio.load(html);
 
    const titleText = $("section.info h2.title").text().trim();
 
    const getTextByTh = (label) => {
      return $(`section.info th:contains("${label}")`)
        .next("td")
        .text()
        .trim() || 'N/A';
    };
 
    const nama_aplikasi = titleText.replace(/^Informasi tentang\s*/i, "").trim();
    const versi = nama_aplikasi.match(/\d+(\.\d+){0,2}/)?.[0] || 'N/A';
    const nama_paket = getTextByTh("Nama Paket");
    const lisensi = getTextByTh("Lisensi");
    const sistem_operasi = getTextByTh("Sistem Op.");
    const kategori = $(`section.info th:contains("Kategori")`).next("td").text().trim() || 'N/A';
    const bahasa = $(`section.info th:contains("Bahasa")`).next("td").text().trim() || 'N/A';
    const penerbit = $(`section.info th:contains("Penerbit")`).next("td").text().trim() || 'N/A';
    const ukuran = getTextByTh("Ukuran");
    const unduhan = getTextByTh("Unduhan");
    const tanggal = getTextByTh("Tanggal");
 
    const dataUrl = $("#detail-download-button").attr("data-url")?.trim() || null;
    
    let downloadLink = 'Not Available';
    if (dataUrl && nama_aplikasi && versi) {
      const appNameSlug = nama_aplikasi
        .replace(/\d+(\.\d+){0,2}/, "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");
      const versionSlug = versi.replace(/\./g, "-");
      downloadLink = `https://dw.uptodown.net/dwn/${dataUrl}/${appNameSlug}-${versionSlug}.apk`;
    }
 
    const results = {
      title: titleText,
      nama_aplikasi,
      versi,
      nama_paket,
      lisensi,
      sistem_operasi,
      kategori,
      bahasa,
      penerbit,
      ukuran,
      unduhan,
      tanggal,
      downloadLink
    };

    return {
      creator: 'deff',
      status: 200,
      result: results
    };
  } catch (err) {
    console.error("Error in uptodown scraper:", err);
    return {
      creator: 'deff',
      status: 500,
      error: err.message
    };
  }
}


// The main handler for the plugin
let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) throw `Please provide an Uptodown URL.\n\n*Example:*\n${usedPrefix + command} https://facebook-lite.en.uptodown.com/android/download`;

  // Show loading message
  await m.reply('🔍 Scraping data from Uptodown, please wait...');

  try {
    const data = await uptodown(text);

    if (data.status !== 200) {
      throw new Error(data.error || 'Failed to fetch data from the URL.');
    }

    const res = data.result;
    
    // Check if a valid download link was found
    if (!res.downloadLink || res.downloadLink === 'Not Available') {
        return m.reply('❌ Could not find a valid download link.');
    }

    // Format the result into a caption and inform the user
    const caption = `
✅ *Scraping Successful!*

*App Name:* ${res.nama_aplikasi}
*Version:* ${res.versi}

📲 Now downloading and sending the file. This may take a moment...
    `.trim();

    await m.reply(caption);

    // Sanitize filename to prevent errors
    const fileName = `${res.nama_aplikasi.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')}-${res.versi}.apk`;

    // Send the APK file as a document
    await conn.sendFile(m.chat, res.downloadLink, fileName, `Here is your file!`, m);


  } catch (e) {
    console.error('Error in uptodown handler:', e);
    m.reply('An error occurred. Please check if the URL is correct and try again.');
  }
};

handler.help = ['uptodown'];
handler.command = ['uptodown'];
handler.tags = ['downloader'];
handler.limit = true;
handler.private = false;

export default handler;
