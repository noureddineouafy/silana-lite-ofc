/*
• SFILE DOWNLOAD PLUGIN USING SCRAPING FROM
DAFFA CHANNEL
*/

import axios from 'axios';
import * as cheerio from 'cheerio';

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return m.reply(`Example:\n${usedPrefix + command} https://sfile.mobi/9chs5aeiaWJ`);
  try {
    let url = text.trim();

    const createHeaders = (referer) => ({
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
      'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="137", "Google Chrome";v="137"',
      'dnt': '1',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
      'Referer': referer,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    });

    const extractCookies = (responseHeaders) =>
      responseHeaders['set-cookie']?.map(cookie => cookie.split(';')[0]).join('; ') || '';

    const extractMetadata = ($) => {
      const metadata = {};
      $('.file-content').eq(0).each((_, el) => {
        const $el = $(el);
        metadata.file_name = $el.find('img').attr('alt');
        metadata.mimetype = $el.find('.list').eq(0).text().trim().split('-')[1].trim();
        metadata.upload_date = $el.find('.list').eq(2).text().trim().split(':')[1].trim();
        metadata.download_count = $el.find('.list').eq(3).text().trim().split(':')[1].trim();
        metadata.author_name = $el.find('.list').eq(1).find('a').text().trim();
      });
      return metadata;
    };

    const makeRequest = async (url, options) => {
      try {
        return await axios.get(url, options);
      } catch (error) {
        if (error.response) return error.response;
        throw new Error(`Request failed: ${error.message}`);
      }
    };

    const download = async (url, resultBuffer = false) => {
      let headers = createHeaders(url);
      const initialResponse = await makeRequest(url, { headers });
      const cookies = extractCookies(initialResponse.headers);
      headers['Cookie'] = cookies;

      let $ = cheerio.load(initialResponse.data);
      const metadata = extractMetadata($);

      const downloadUrl = $('#download').attr('href');
      if (!downloadUrl) return m.reply('Download URL not found');

      headers['Referer'] = downloadUrl;
      const processResponse = await makeRequest(downloadUrl, { headers });

      $ = cheerio.load(processResponse.data);
      const downloadButton = $('#download');
      if (!downloadButton.length) return m.reply('Download button not found');

      const onClickAttr = downloadButton.attr('onclick');
      if (!onClickAttr) return m.reply('No "onclick" attribute found');

      const key = onClickAttr.split("'+'")[1]?.split("';")[0];
      if (!key) return m.reply('Failed to retrieve download key');

      const finalUrl = downloadButton.attr('href') + '&k=' + key;

      let fileBuffer;
      if (resultBuffer) {
        const fileResponse = await makeRequest(finalUrl, {
          headers,
          responseType: 'arraybuffer'
        });
        fileBuffer = Buffer.from(fileResponse.data);
      }

      return {
        metadata,
        fileBuffer,
        finalUrl
      };
    };

    await m.reply('*_P R O C E S S I N G..._*');

    let { metadata, fileBuffer, finalUrl } = await download(url, true);

    if (!fileBuffer) return m.reply('Failed to retrieve file buffer');

    await conn.sendFile(
      m.chat,
      fileBuffer,
      metadata.file_name || 'file.unknown',
      `📁 \`SFILE DOWNLOADER\`\n\n` +
      `🧾 *File Name:* ${metadata.file_name}\n` +
      `📂 *File Type:* ${metadata.mimetype}\n` +
      `📅 *Uploaded On:* ${metadata.upload_date}\n` +
      `✍️ *Author:* ${metadata.author_name}\n` +
      `📥 *Downloaded:* ${metadata.download_count} times`,
      m
    );

  } catch (e) {
    console.error(e);
    return m.reply('❌ Failed to fetch or send file from SFile. Make sure the link is correct, the file is available, and it doesn’t require a password.');
  }
};

handler.help = ["sfile"];
handler.tags = ["downloader"];
handler.command = ["sfile"];
handler.limit = true;
export default handler;
