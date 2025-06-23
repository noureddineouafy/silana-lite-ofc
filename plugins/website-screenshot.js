// @noureddine_ouafy
// Screenshot Website Plugin
// Source: https://whatsapp.com/channel/0029VakezCJDp2Q68C61RH2C

import axios from 'axios'

async function screenshotWebsite(url, type = 'desktop') {
  if (!/^https?:\/\//.test(url)) {
    return {
      status: 'error',
      message: '❌ المرجو إدخال رابط صحيح يبدأ بـ http أو https.',
    }
  }

  const types = {
    desktop: { device: 'desktop', fullPage: false },
    mobile:  { device: 'mobile', fullPage: false },
    full:    { device: 'desktop', fullPage: true },
  }

  if (!(type in types)) {
    return {
      status: 'error',
      message: '❌ النوع غير معروف. استعمل "desktop" أو "mobile" أو "full".',
    }
  }

  const { device, fullPage } = types[type]

  try {
    const payload = { url: url.trim(), device, fullPage }

    const res = await axios.post(
      'https://api.magickimg.com/generate/website-screenshot',
      payload,
      {
        responseType: 'arraybuffer',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://magickimg.com',
          'Referer': 'https://magickimg.com',
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0',
        },
      }
    )

    const buffer = Buffer.from(res.data)
    return { status: 'success', buffer }

  } catch (e) {
    return {
      status: 'error',
      message: e.message || '❌ حدث خطأ أثناء التقاط الصورة.',
    }
  }
}

let handler = async (m, { conn, args, text }) => {
  let [url, type] = text.split('|').map(v => v.trim())
  if (!url) return m.reply('📸 أرسل الرابط بهذه الطريقة:\n.screenshot https://example.com | desktop')

  type = type || 'desktop'
  const result = await screenshotWebsite(url, type)

  if (result.status === 'success') {
    await conn.sendFile(m.chat, result.buffer, 'screenshot.png', `📸 تم التقاط صورة للموقع:\n🌐 ${url}\n🖥️ الوضع: ${type}`, m)
  } else {
    m.reply(result.message)
  }
}

handler.help = ['website-screenshot']
handler.tags = ['tools']
handler.command = ['website-screenshot']
handler.limit = true

export default handler
