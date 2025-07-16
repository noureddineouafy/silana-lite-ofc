// plugin  by instagram.com/noureddine_ouafy
//  Base: https://play.google.com/store/apps/details?id=ai.generated.art.maker.image.picture.photo.generator.painting
// Author: Shannz
import axios from 'axios'
import FormData from 'form-data'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const arta = {
  signUp: async () => {
    const data = JSON.stringify({ clientType: 'CLIENT_TYPE_ANDROID' })
    const config = {
      method: 'POST',
      url: 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=AIzaSyB3-71wG0fIt0shj0ee4fvx1shcjJHGrrQ',
      headers: {
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 10; SM-G9650 Build/QD4A.200805.003)',
        'Content-Type': 'application/json',
        'X-Android-Package': 'ai.generated.art.maker.image.picture.photo.generator.painting',
        'X-Android-Cert': 'ADC09FCA89A2CE4D0D139031A2A587FA87EE4155'
      },
      data
    }
    const res = await axios(config)
    return {
      token: res.data.idToken,
      refresh_token: res.data.refreshToken
    }
  },

  getStyles: async () => {
    const { data } = await axios.get('https://contentcdnhub.com/cms/content/apps/AIArtaAndroid/release/8/default/styles.json')
    const block = data.content.find(b => b.name === 'textToImage_styles_v3')
    return block.items.map(i => i.unique_id)
  },

  text2image: async (prompt, style, token, images_num = 1) => {
    const data = new FormData()
    data.append('prompt', prompt)
    data.append('negative_prompt', '')
    data.append('style', style)
    data.append('images_num', images_num.toString())
    data.append('cfg_scale', '7')
    data.append('steps', '30')
    data.append('aspect_ratio', '1:1')

    const config = {
      method: 'POST',
      url: 'https://img-gen-prod.ai-arta.com/api/v1/text2image',
      headers: {
        'User-Agent': 'AiArt/3.23.12 okHttp/4.12.0 Android Q',
        'authorization': token,
        ...data.getHeaders()
      },
      data
    }

    const res = await axios(config)
    console.log('📄 recordId response:', res.data)
    return res.data.record_id
  },

  cekText2image: async (record_id, token) => {
    let retries = 0
    while (retries < 20) {
      const config = {
        method: 'GET',
        url: `https://img-gen-prod.ai-arta.com/api/v1/text2image/${record_id}/status`,
        headers: {
          'User-Agent': 'AiArt/3.23.12 okHttp/4.12.0 Android Q',
          'authorization': token
        }
      }
      const res = await axios(config)

      console.log('📦 Full API response:', res.data)

      if (res.data.status === 'DONE') {
        return res.data.response || res.data
      }

      await delay(3000)
      retries++
    }

    throw '❌ Timeout: Image generation still pending after multiple retries.'
  }
}

let handler = async (m, { conn, text }) => {
  // تفصيل الاستخدام:
  // الصيغة: .test [عدد الصور] | [النص]
  // مثال: .test 3 | a futuristic city at sunset
  // إذا لم تحدد عدد، يرسل صورة واحدة فقط.

  if (!text) {
    // فقط الرد مع أمثلة الاستخدام والستايلات
    const styles = await arta.getStyles()
    let stylesList = styles.slice(0, 10).join('\n') // نعرض أول 10 فقط للبساطة
    let reply = `
🚀 *أمثلة استخدام أمر توليد الصورة*:
.test 1 | astronaut in a forest
.test 3 | beautiful sunset over the mountains

🎨 *الستايلات المتاحة (أول 10 فقط)*:
${stylesList}

✅ يمكنك طلب من 1 إلى 5 صور في المرة الواحدة.

مثال: .test 2 | a cat wearing sunglasses
    `.trim()
    return m.reply(reply)
  }

  // نحاول تفكيك نص الإدخال: عدد الصور | نص الوصف
  let images_num = 1
  let prompt = text

  // إذا كان النص يحتوي على | نفصل العدد والوصف
  if (text.includes('|')) {
    const parts = text.split('|')
    if (parts.length >= 2) {
      let numPart = parts[0].trim()
      const promptPart = parts.slice(1).join('|').trim()
      if (!isNaN(numPart)) {
        images_num = Math.min(Math.max(parseInt(numPart), 1), 5) // الحد بين 1 و 5
        prompt = promptPart
      } else {
        // إذا لم يكن عدد صحيح، نعتبر النص كله برومبت
        prompt = text.trim()
      }
    }
  }

  if (!prompt) throw '🚫 يرجى إدخال نص الوصف بعد العدد (أو فقط النص).'

  await m.reply(`⏳ جاري توليد ${images_num} صورة/صور...\n📸 الوصف: ${prompt}`)

  try {
    const { token } = await arta.signUp()
    console.log('🪪 token:', token)

    const styles = await arta.getStyles()
    console.log('🎨 available styles:', styles)

    const style = styles[Math.floor(Math.random() * styles.length)]
    console.log('🎯 selected style:', style)

    const recordId = await arta.text2image(prompt, style, token, images_num)
    console.log('📄 recordId:', recordId)

    const result = await arta.cekText2image(recordId, token)
    console.log('🔥 Final result:', result)

    if (!result || !Array.isArray(result)) {
      console.log('⚠️ result is not array:', result)
      throw '❌ فشل في توليد الصورة. تحقق من السجلات لمزيد من التفاصيل.'
    }

    for (const img of result) {
      await conn.sendFile(m.chat, img.url, 'ai-art.jpg', `🎨 الوصف: ${prompt}\n🖌️ الستايل: ${style}`, m)
    }

  } catch (e) {
    console.error('❌ ERROR:', e)
    throw typeof e === 'string' ? e : '❌ خطأ غير متوقع. تحقق من سجلات الكونسول.'
  }
}

handler.help = ['img-gen']
handler.command = ['img-gen']
handler.tags = ['ai']
handler.limit = true
export default handler
