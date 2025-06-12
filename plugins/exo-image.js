// instagram.com/noureddine_ouafy
import fetch from 'node-fetch'

const ai = {
  enhancePrompt: async (prompt) => {
    if (!prompt) throw Error(`❌ المرجو إدخال جملة لإنشاء الصورة.`)
    const res = await fetch("https://exomlapi.com/api/prompts/enhance", {
      method: "POST",
      body: JSON.stringify({ prompt }),
      headers: { 'Content-Type': 'application/json' }
    })
    if (!res.ok) throw Error(`❌ فشل تحسين الجملة: ${res.status} ${res.statusText}`)
    const json = await res.json()
    return json
  },

  generateImage: async (prompt, options = {}) => {
    if (!prompt) throw Error(`❌ المرجو إدخال جملة لإنشاء الصورة.`)

    const modelList = ["exo-image", "flux.1-schnell", "flux.1-pro", "flux.1-dev"]
    const { model = modelList[2], enhancePrompt = false } = options

    if (!modelList.includes(model)) throw Error(`❌ الموديل غير موجود. الموديلات المتوفرة: ${modelList.join(", ")}`)
    if (typeof enhancePrompt !== 'boolean') throw Error(`❌ خيار enhancePrompt غير صحيح.`)

    let usedPrompt = prompt
    if (enhancePrompt) {
      try {
        usedPrompt = (await ai.enhancePrompt(prompt)).enhancedPrompt
      } catch (e) {
        console.log(`⚠️ فشل تحسين الجملة. سيتم توليد الصورة بالجملة الأصلية.\n${e.message}`)
      }
    }

    const res = await fetch("https://exomlapi.com/api/images/generate", {
      method: "POST",
      body: JSON.stringify({ prompt: usedPrompt, model, size: "1024x1024" }),
      headers: { 'Content-Type': 'application/json' }
    })
    if (!res.ok) throw Error(`❌ فشل إنشاء الصورة: ${res.status} ${res.statusText}`)
    const json = await res.json()
    return { prompt, usedPrompt, model, enhancePrompt, ...json }
  }
}

let handler = async (m, { conn, text, args }) => {
  if (!text) throw '🖼️ اكتب وصف الصورة التي تريد إنشاءها.\nمثال:\n.image neko girl in anime style'
  
  const enhance = args.includes('--enhance')
  const model = args.find(arg => ['exo-image', 'flux.1-schnell', 'flux.1-pro', 'flux.1-dev'].includes(arg)) || 'flux.1-pro'

  m.reply('🔄 جاري إنشاء الصورة، المرجو الانتظار...')

  try {
    const result = await ai.generateImage(text, { model, enhancePrompt: enhance })
    const imageUrl = result?.data?.[0]?.url
    if (!imageUrl) throw '❌ لم يتم العثور على رابط الصورة.'

    await conn.sendFile(m.chat, imageUrl, 'image.jpg', `✅ تم إنشاء الصورة.\n📌 Prompt: ${result.usedPrompt}`, m)
  } catch (e) {
    m.reply(`❌ وقع خطأ: ${e.message}`)
  }
}

handler.help = ['exo-image']
handler.tags = ['ai']
handler.command = /^exo-image$/i
handler.limit = true
export default handler
