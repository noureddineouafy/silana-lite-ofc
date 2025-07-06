// @noureddine_ouafy
// thanks siputzx
import axios from 'axios';
import FormData from 'form-data';

const downloadYouTube = async (url) => {
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
    formData2.append('format', 'mp3');
    formData2.append('video_format_id', '');
    formData2.append('audio_format_id', '251');
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
          error: status.error_message || 'Download failed'
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
  if (!text) return m.reply(`❌ الرجاء إدخال رابط اليوتيوب.\n📌 مثال:\n ${usedPrefix + command} https://youtu.be/video_id`);
  
  m.reply("⏳ المرجو الانتظار قليلا لا تنسى ان تتابع \ninstagram.com/noureddine_ouafy");

  const result = await downloadYouTube(text);
  if (!result.success) return m.reply(`❌ فشل التحميل: ${result.error}`);

  await conn.sendMessage(m.chat, {
    audio: {
      url: result.downloadUrl
    },
    mimetype: 'audio/mp4',
    ptt: false
  }, { quoted: m });
};

handler.help = ['ytmp3v2'];
handler.command = ['ytmp3v2'];
handler.tags = ['downloader'];
handler.limit = true;

export default handler;
