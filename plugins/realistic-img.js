/*
  • Realistic AI Image Generator
  • instagram.com/noureddine_ouafy
  • scrape by SaaOffc
*/

import axios from 'axios'
import FormData from 'form-data'

const styleMap = {
  photorealistic: 'photorealistic style image',
  cinematic: 'cinematic style image',
  hyperreal: 'hyperrealistic style image',
  portrait: 'portrait style image'
}

const resolutionMap = {
  '512x512': { width: 512, height: 512 },
  '768x768': { width: 768, height: 768 },
  '1024x1024': { width: 1024, height: 1024 },
  '1920x1080': { width: 1920, height: 1080 }
}

async function generateRealisticImage({ prompt, style = 'photorealistic', resolution = '768x768', seed = null }) {
  const selectedStyle = styleMap[style.toLowerCase()]
  const selectedRes = resolutionMap[resolution]

  if (!selectedStyle || !selectedRes) {
    return { success: false, error: '❌ Style أو resolution غير موجودين' }
  }

  const fullPrompt = `${selectedStyle}: ${prompt}`
  const form = new FormData()
  form.append('action', 'generate_realistic_ai_image')
  form.append('prompt', fullPrompt)
  form.append('seed', (seed || Math.floor(Math.random() * 100000)).toString())
  form.append('width', selectedRes.width.toString())
  form.append('height', selectedRes.height.toString())

  try {
    const res = await axios.post('https://realisticaiimagegenerator.com/wp-admin/admin-ajax.php', form, {
      headers: {
        ...form.getHeaders(),
        'origin': 'https://realisticaiimagegenerator.com',
        'referer': 'https://realisticaiimagegenerator.com/',
        'user-agent': 'Mozilla/5.0',
        'accept': '*/*'
      }
    })

    const json = res.data
    if (json?.success && json.data?.imageUrl) {
      return { success: true, url: json.data.imageUrl }
    } else {
      return { success: false, error: '❌ لم يتم العثور على نتيجة' }
    }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

let handler = async (m, { conn, text, command }) => {
  const [style = 'photorealistic', resolution = '768x768', ...promptArr] = text.split('|').map(v => v.trim())
  const prompt = promptArr.join(' ')

  if (!prompt) {
    return m.reply(`✳️ طريقة الاستعمال:
${command} <style>|<resolution>|<prompt>

🔹 مثال:
${command} cinematic|1920x1080|فتاة تجلس في حديقة خيالية وقت الغروب

🖼️ الأنماط:
photorealistic, cinematic, hyperreal, portrait

📐 الأحجام:
512x512, 768x768, 1024x1024, 1920x1080`)
  }

  await m.reply('⏳ المرجو الانتظار قليلا لا تنسى ان تتابع \ninstagram.com/noureddine_ouafy')

  const result = await generateRealisticImage({ prompt, style, resolution })

  if (result.success) {
    conn.sendFile(m.chat, result.url, 'image.jpg', `🖼️ النتيجة لـ: ${prompt}`, m)
  } else {
    m.reply(`❌ خطأ: ${result.error}`)
  }
}

handler.help = ['realistic-img']
handler.tags = ['ai']
handler.command = ['realistic-img']
handler.limit = true

export default handler
