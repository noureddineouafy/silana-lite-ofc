// @noureddine_ouafy
import axios from 'axios'
import { createHash, randomUUID } from 'crypto'

let handler = async (m, { conn, args, command }) => {
  let [module = 'SUMMARIZE', ...rest] = args
  let inputText = rest.join(' ').trim()

  if (!inputText) {
    return m.reply(`✍️ *طريقة استعمال الأمر .${command}*\n\n🔹 يمكنك استخدام إحدى الوحدات التالية:\n\n📌 *SUMMARIZE* – لتلخيص النصوص\nمثال: .${command} SUMMARIZE هذا نص طويل يحتاج تلخيصًا\n\n📌 *TRANSLATE* – للترجمة إلى لغة أخرى\nمثال: .${command} TRANSLATE English | السلام عليكم\n\n📌 *TONE* – لتغيير نغمة النص\nمثال: .${command} TONE Friendly | كيف حالك؟\nأو نغمة مخصصة:\n.${command} TONE Other | Shy | مرحبًا\n\n📌 *REPLY* – للرد بنمط معين\nمثال: .${command} REPLY Medium | ما رأيك؟\n(الأنماط: Short, Medium, Long)\n\n📌 *PARAPHRASE* – إعادة صياغة\nمثال: .${command} PARAPHRASE هذا نص معاد الصياغة\n\n📌 *EXPAND* – توسيع الأفكار\nمثال: .${command} EXPAND فكرة مختصرة\n\n📌 *GRAMMAR* – تصحيح لغوي\nمثال: .${command} GRAMMAR انا سعيده جدا اليوم\n\n🧠 كل ما عليك هو تحديد *module* (الوحدة) ثم النص\n`)
  }

  let to = ''
  let customTone = ''

  if (module === 'TRANSLATE' || module === 'TONE' || module === 'REPLY') {
    const parts = inputText.split('|')
    to = parts[0]?.trim()
    inputText = parts.slice(1).join('|').trim() || inputText
    if (module === 'TONE' && to === 'Other') {
      customTone = parts[1]?.trim()
      inputText = parts.slice(2).join('|').trim() || inputText
    }
  }

  const modules = ['SUMMARIZE', 'PARAPHRASE', 'EXPAND', 'TONE', 'TRANSLATE', 'REPLY', 'GRAMMAR']
  const tones = ['Friendly', 'Romantic', 'Sarcastic', 'Humour', 'Social', 'Angry', 'Sad', 'Other']
  const replies = ['Short', 'Medium', 'Long']

  if (!modules.includes(module)) {
    return m.reply(`❌ الموديول غير صحيح، اختر أحد التالي:\n${modules.join(', ')}`)
  }

  if (module === 'TONE' && (!to || (!tones.includes(to) && to !== 'Other'))) {
    return m.reply(`⚠️ tone غير صالح، اختر واحد من:\n${tones.join(', ')}`)
  }

  if (module === 'TONE' && to === 'Other' && !customTone) {
    return m.reply(`🔧 عند اختيار 'Other' يجب كتابة custom tone مثل:\n.${command} TONE Other | Shy | هذا نص`)
  }

  if (module === 'TRANSLATE' && !to) {
    return m.reply(`🌐 يجب تحديد اللغة الهدف مثل:\n.${command} TRANSLATE English | السلام عليكم`)
  }

  if (module === 'REPLY' && !replies.includes(to)) {
    return m.reply(`✍️ اختر حجم الرد من:\n${replies.join(', ')}`)
  }

  m.reply("⏳ المرجو الانتظار قليلاً...")

  const _shorten = (input) => input.length >= 5 ? input.substring(0, 5) : 'O'.repeat(5 - input.length) + input
  const _hashString = (str) => createHash('sha256').update(str, 'utf8').digest('hex')

  try {
    const prefix = `${_shorten(inputText)}ZERO`
    const key = _hashString(prefix)
    const userId = `GALAXY_AI${randomUUID()}`
    const toValue = module === 'TONE' && to === 'Other' ? customTone : to

    const payload = {
      k: key,
      module,
      text: inputText,
      to: toValue,
      userId
    }

    const headers = {
      'user-agent': 'Postify/1.0.0',
      'content-type': 'application/json',
      'accept-language': 'en'
    }

    const { data } = await axios.post(
      'https://translapp.info/ai/g/ask',
      payload,
      { headers }
    )

    let reply = `✅ *Module:* ${module}\n📥 *Input:*\n${inputText}\n\n📤 *Output:*\n${data.message}`
    m.reply(reply)

  } catch (error) {
    m.reply(`❌ حدث خطأ: ${error.response?.data?.message || error.message || 'خطأ غير معروف'}`)
  }
}

handler.help = ['translapp']
handler.tags = ['ai']
handler.command = ['translapp']
handler.limit = true
export default handler
