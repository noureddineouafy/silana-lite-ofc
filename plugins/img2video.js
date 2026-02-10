import axios from "axios";
import FormData from "form-data";

const fkontak = {
  key: { participant: '0@s.whatsapp.net', remoteJid: '0@s.whatsapp.net', fromMe: false, id: 'Halo' },
  message: { conversation: 'Converting Image To Video 🖼➡📹' }
};

let handler = async (m, { conn, text, usedPrefix, command }) => {
  let q = m.quoted ? m.quoted : m;
  let mime = (q.msg || q.imageMessage || q).mimetype || q.mediaType || "";

  if (!mime || !mime.includes("image")) return m.reply(
    `*❗Send/Reply to an image with caption:*\n> ${usedPrefix + command} [prompt]`
  );
  
  if (!text) return m.reply(
    `*❗Where is the prompt?*\n\n*📝 Example:*\n> ${usedPrefix + command} turn the character into a champion holding a trophy above their head`
  );
  
  conn.sendMessage(m.chat, { react: { text: "🔁", key: m.key } });

  let upload;
  let imageUrl;
  let prompt = text;
  
  try {
    conn.sendMessage(m.chat, { text: "⏳ Uploading image to temporary server..." }, { quoted: fkontak });

    let buffer = await q.download();
    let form = new FormData();
    form.append("file", buffer, "image.jpg");

    upload = await axios.post("https://tmpfiles.org/api/v1/upload", form, {
      headers: form.getHeaders(),
      timeout: 180000,
    });

    let raw = upload.data.data.url;
    let id = raw.split("/")[3];
    imageUrl = `https://tmpfiles.org/dl/${id}/image.jpg`;
    
  } catch (e) {
    conn.sendMessage(m.chat, { react: { text: "❗", key: m.key } });
    let errorMsg = e.response
      ? `Server error: ${e.response.status} - ${JSON.stringify(e.response.data)}`
      : e.message;
    return m.reply(`Failed to upload image to tmpfiles.org.\n*Error:* ${errorMsg}`);
  }
  
  let taskId;
  try {
    conn.sendMessage(m.chat, { text: "⏳ Creating video task... (API: veo31ai.io)" }, { quoted: fkontak });

    let payload = {
      videoPrompt: prompt,
      videoAspectRatio: "16:9",
      videoDuration: 5,
      videoQuality: "540p",
      videoModel: "v4.5",
      videoImageUrl: imageUrl,
      videoPublic: false,
    };

    let gen = await axios.post("https://veo31ai.io/api/pixverse-token/gen", payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 60000,
    });

    taskId = gen.data.taskId;
    if (!taskId) return m.reply("❌ Failed to get taskId from veo31ai.io. ('gen' API did not return taskId)");

  } catch (e) {
    conn.sendMessage(m.chat, { react: { text: "❗", key: m.key } });
    let errorMsg = e.response
      ? `Server error: ${e.response.status} - ${JSON.stringify(e.response.data)}`
      : e.message;
    return m.reply(`Failed to start video generation process.\n*Error:* ${errorMsg}`);
  }
  
  try {
    conn.sendMessage(m.chat, { 
      text: `✅ Task successfully created
(Task ID: ${taskId}).
⏳ Processing video... This may take 3–5 minutes. Please wait.` 
    }, { quoted: fkontak });
    
    let videoUrl;
    const timeout = Date.now() + 300000;
    
    while (Date.now() < timeout) {
      await new Promise((r) => setTimeout(r, 10000));

      let res;
      try {
        res = await axios.post(
          "https://veo31ai.io/api/pixverse-token/get",
          {
            taskId,
            videoPublic: false,
            videoQuality: "540p",
            videoAspectRatio: "16:9",
            videoPrompt: prompt,
          },
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (pollError) {
        console.error("Polling error:", pollError.message);
        continue;
      }

      if (res.data?.videoData?.url) {
        videoUrl = res.data.videoData.url;
        break;
      }
    }

    if (!videoUrl) return m.reply("❌ Failed to retrieve video. Timeout reached (5 minutes) or server failed.");

    await conn.sendFile(m.chat, videoUrl, "img2video.mp4", `\`PROMPT:\`\n\n${prompt}`, fkontak);
    conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
    
  } catch (e) {
    conn.sendMessage(m.chat, { react: { text: "❗", key: m.key } });
    let errorMsg = e.response
      ? `Server error: ${e.response.status} - ${JSON.stringify(e.response.data)}`
      : e.message;
    m.reply(`An error occurred while waiting for or retrieving the video.\n*Error:* ${errorMsg}`);
  }
};

handler.help = ["img2video"];
handler.tags = ["ai"];
handler.command = ["img2video"];
handler.limit = true;

export default handler;
