// Instagram: noureddine_ouafy
// Download videos from multiple platforms using On4t.com
// scrape by rikikangsc2-eng
import axios from 'axios';
import cheerio from 'cheerio';

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
  if (!text) throw ` *On4t Video Downloader*

*How to use:*
Type the command followed by the video URL:
Example: .on4t https://www.tiktok.com/@example/video/123456

*Supported Platforms:*
- TikTok
- Instagram (Reels, Stories, IGTV, Photos)
- Facebook (including Reels)
- Twitter
- Pinterest
- Vimeo
- Dailymotion

No watermark | Fast & Free`;

  try {
    const videoData = await getVideoDownloadLinks(text);

    if (!videoData.length) throw 'No downloadable videos found for this link.';

    for (const item of videoData) {
      await conn.sendFile(m.chat, item.video_file_url, 'video.mp4', `*${item.title}*`, m);
    }

  } catch (err) {
    throw err.message || 'Failed to download the video.';
  }
};

handler.help = ['on4t'];
handler.tags = ['downloader'];
handler.command = ['on4t']; // you can rename commands
handler.limit = true;
export default handler;

// Utility functions
async function fetchInitialPage(initialUrl) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185) AppleWebKit/537.36 Chrome/136.0.7103.60 Mobile Safari/537.36',
    'Referer': initialUrl,
  };

  const response = await axios.get(initialUrl, { headers });
  const $ = cheerio.load(response.data);
  const csrfToken = $('meta[name="csrf-token"]').attr('content');
  let cookies = response.headers['set-cookie']?.join('; ') || '';

  if (!csrfToken) throw new Error('Security token not found.');

  return { csrfToken, cookies };
}

async function postDownloadRequest(downloadUrl, userUrl, csrfToken, cookies) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185) AppleWebKit/537.36 Chrome/136.0.7103.60 Mobile Safari/537.36',
    'Referer': 'https://on4t.com/online-video-downloader',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Accept': '*/*',
    'X-Requested-With': 'XMLHttpRequest',
    'Cookie': cookies
  };

  const postData = new URLSearchParams();
  postData.append('_token', csrfToken);
  postData.append('link[]', userUrl);

  const response = await axios.post(downloadUrl, postData.toString(), { headers });

  if (!response.data?.result?.length) throw new Error('No result returned. Try a different link.');

  return response.data.result.map(item => ({
    title: item.title,
    videoimg_file_url: item.videoimg_file_url,
    video_file_url: item.video_file_url,
    image: item.image
  }));
}

async function getVideoDownloadLinks(url) {
  const initialUrl = 'https://on4t.com/online-video-downloader';
  const downloadUrl = 'https://on4t.com/all-video-download';
  const { csrfToken, cookies } = await fetchInitialPage(initialUrl);
  return await postDownloadRequest(downloadUrl, url, csrfToken, cookies);
}

// Usage Info for Users (Optional to send in bot reply)
handler.before = async (m, { conn, command }) => {
  if (command === 'on4t') {
    const info = `
*On4t Video Downloader*

*How to use:*
Type the command followed by the video URL:
Example: .on4t https://www.tiktok.com/@example/video/123456

*Supported Platforms:*
- TikTok
- Instagram (Reels, Stories, IGTV, Photos)
- Facebook (including Reels)
- Twitter
- Pinterest
- Vimeo
- Dailymotion

No watermark | Fast & Free
    `.trim();
    await m.reply(info);
  }
};
