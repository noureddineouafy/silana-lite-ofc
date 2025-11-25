// Instagram: noureddine_ouafy
// scrape by abellame
import fetch from "node-fetch";

async function hai(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" },
      redirect: "follow"
    })
    const data = await res.text()

    const video = data.match(/"contentUrl":"(https:\/\/v1\.pinimg\.com\/videos\/[^"]+\.mp4)"/)
    const image =
      data.match(/"imageSpec_736x":\{"url":"(https:\/\/i\.pinimg\.com\/736x\/[^"]+)"/) ||
      data.match(/"imageSpec_564x":\{"url":"(https:\/\/i\.pinimg\.com\/564x\/[^"]+)"/)
    const title = data.match(/"name":"([^"]+)"/)
    const author = data.match(/"fullName":"([^"]+)".+?"username":"([^"]+)"/)

    return {
      type: video ? "video" : "image",
      title: title?.[1] || "-",
      author: author?.[1] || "-",
      username: author?.[2] || "-",
      media: video?.[1] || image?.[1] || "-",
    }
  } catch (e) {
    return { error: e.message }
  }
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    throw `🔎 المرجو إرسال رابط Pinterest\n\nمثال:\n${usedPrefix + command} https://pin.it/xxxxxx`
  }

  // رسالة الانتظار المفضلة عندك
  await m.reply(`المرجو الانتظار قليلا لا تنسى ان تتابع \ninstagram.com/noureddine_ouafy`)

  const res = await hai(text)
  if (res.error) throw `❌ حدث خطأ: ${res.error}`

  let caption = `
✨ *Pinterest Downloader*
📌 *العنوان:* ${res.title}
👤 *الناشر:* ${res.author} (@${res.username})
🎞️ *النوع:* ${res.type}
  `.trim()

  if (res.type === "video") {
    await conn.sendMessage(m.chat, { video: { url: res.media }, caption }, { quoted: m })
  } else {
    await conn.sendMessage(m.chat, { image: { url: res.media }, caption }, { quoted: m })
  }
}

handler.help = handler.command = ['pinterestdown']
handler.tags = ['downloader']
handler.limit = true

export default handler
