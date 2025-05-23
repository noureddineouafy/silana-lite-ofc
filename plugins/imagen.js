// instagram.com/noureddine_ouafy
// scrape by wolfyflutter
let handler = async (m, { conn, text }) => {
  if (!text) throw 'من فضلك أكتب وصفاً للصورة (prompt)'

  const prompt = text.trim()

  const payload = {
    prompt,
    model: 'imagen_3_5',
    size: '1024x1024',
    response_format: 'url'
  }

  const headers = {
    accept: '*/*',
    'content-type': 'application/json',
    Referer: 'https://imagen.exomlapi.com/'
  }

  try {
    const res = await fetch('https://imagen.exomlapi.com/v1/images/generations', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })

    if (!res.ok) throw `فشل إنشاء الصورة.\nstatus: ${res.status} ${res.statusText}`

    const json = await res.json()

    if (!json.data || !json.data[0]?.url) throw 'تعذر الحصول على رابط الصورة.'

    await conn.sendFile(m.chat, json.data[0].url, 'image.jpg', `تم توليد الصورة بناءً على وصفك: "${prompt}"`, m)
  } catch (e) {
    throw `وقع خطأ أثناء توليد الصورة:\n${e}`
  }
}

handler.help = handler.command = ['imagen']
handler.tags = ['ai']
handler.limit = true
handler.cooldown = 60 * 1000 // 1 دقيقة
export default handler
