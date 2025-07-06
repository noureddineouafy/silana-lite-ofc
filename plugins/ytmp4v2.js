// @noureddine_ouafy
// thanks siputzx
import axios from 'axios';
import FormData from 'form-data';

const downloadYouTubeVideo = async (url) => {
  const baseURL = 'https://backand-ytdl.siputzx.my.id/api';
  const headers = {
    'authority': 'backand-ytdl.siputzx.my.id',
    'accept': '*/*',
    'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'origin': 'https://yuyuyu.siputzx.my.id',
    'referer': 'https://yuyuyu.siputzx.my.id/',
    'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36'
  };

  try {
    const formData1 = new FormData();
    formData1.append('url', url);

    const infoResponse = await axios.post(`${baseURL}/get-info`, formData1, {
      headers: { ...headers, ...formData1.getHeaders() }
    });

    const videoInfo = infoResponse.data;

    const formData2 = new FormData();
    formData2.append('id', videoInfo.id);
    formData2.append('format', 'mp4'); // الفيديو هذه المرة
    formData2.append('video_format_id', '18'); // جودة 360p
    formData2.append('audio_format_id', '251'); // صوت جيد
    formData2.append('info', JSON.stringify(videoInfo));

    const jobResponse = await axios.post(`${baseURL}/create_job`, formData2, {
      headers: { ...headers, ...formData2.getHeaders() }
    });

    const jobId = jobResponse.data.job_id;

    while (true) {
      const statusResponse = await axios.get(`${baseURL}/check_job/${jobId}`, { headers });
      const status = statusResponse.data;

      if (status.status === 'completed') {
        return {
          success: true,
          title: videoInfo.title,
          duration: videoInfo.duration,
          thumbnail: videoInfo.thumbnail,
          downloadUrl: `https://backand-ytdl.siputzx.my.id${status.download_url}`
        };
      }

      if (status.status === 'failed' || status.error_message) {
        return {
          success: false,
          error: status.error_message || 'فشل في إنشاء الرابط'
        };
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

let handler = async (m, { conn, args, text, usedPrefix, command }) => {
  if (!text) return m.reply(`❌ أدخل رابط يوتيوب صالح.\n📌 مثال: ${usedPrefix + command} https://youtu.be/abc123`);

  m.reply("⏳ المرجو الانتظار قليلا لا تنسى ان تتابع \ninstagram.com/noureddine_ouafy");

  const result = await downloadYouTubeVideo(text);
  if (!result.success) return m.reply(`❌ فشل التحميل: ${result.error}`);

  await conn.sendFile(
    m.chat,
    result.downloadUrl,
    result.title + ".mp4",
    `🎬 *${result.title}*\n⏱️ المدة: ${result.duration}\n📥 تم التحميل بنجاح`,
    m
  );
};

handler.help = ['ytmp4v2'];
handler.command = ['ytmp4v2'];
handler.tags = ['downloader'];
handler.limit = true;

export default handler;
