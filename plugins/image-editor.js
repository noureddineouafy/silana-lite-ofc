// plugin from ARONA-MD sc thanks 
// modified by instagram.com/noureddine_ouafy
import fetch from "node-fetch"

class ImgEditor {
  static base = "https://imgeditor.co/api"

  static async getUploadUrl(buffer) {
    const res = await fetch(`${this.base}/get-upload-url`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fileName: "photo.jpg",
        contentType: "image/jpeg",
        fileSize: buffer.length
      })
    })
    return res.json()
  }

  static async upload(uploadUrl, buffer) {
    await fetch(uploadUrl, {
      method: "PUT",
      headers: { "content-type": "image/jpeg" },
      body: buffer
    })
  }

  static async generate(prompt, imageUrl) {
    const res = await fetch(`${this.base}/generate-image`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        prompt,
        styleId: "realistic",
        mode: "image",
        imageUrl,
        imageUrls: [imageUrl],
        numImages: 1,
        outputFormat: "png",
        model: "nano-banana"
      })
    })
    return res.json()
  }

  static async check(taskId) {
    while (true) {
      await new Promise(r => setTimeout(r, 2500))
      const res = await fetch(`${this.base}/generate-image/status?taskId=${taskId}`)
      const json = await res.json()
      if (json.status === "completed") return json.imageUrl
      if (json.status === "failed") throw new Error("Task failed")
    }
  }
}

let handler = async (m, { conn, text }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ""
  
  if (!/image/.test(mime))
    return m.reply(
`Please reply/send an image with caption:

*image-editor <your prompt>*

Example:
image-editor turn into anime boy`
    )

  if (!text)
    return m.reply(
`You forgot to include a prompt!

Example:
image-editor make this photo Pixar style`
    )

  const prompt = text.trim()
  const wait = await conn.sendMessage(
    m.chat,
    { text: "Downloading image..." },
    { quoted: m }
  )

  let buffer
  try {
    buffer = await q.download()
    if (!buffer) throw ""
  } catch {
    return conn.sendMessage(m.chat, {
      edit: wait.key,
      text: "Failed to download the image!"
    })
  }

  await conn.sendMessage(m.chat, { edit: wait.key, text: "Uploading image..." })

  try {
    const up = await ImgEditor.getUploadUrl(buffer)
    await ImgEditor.upload(up.uploadUrl, buffer)

    await conn.sendMessage(m.chat, {
      edit: wait.key,
      text: "Generating AI image (may take 20–50 seconds)..."
    })

    const task = await ImgEditor.generate(prompt, up.publicUrl)
    const resultUrl = await ImgEditor.check(task.taskId)

    await conn.sendMessage(
      m.chat,
      {
        image: { url: resultUrl },
        caption: `Done!\nPrompt: ${prompt}\n\n📝 *How to use:*\nReply to a photo or send a new one with caption:\nimage-editor <prompt>\n\nExamples:\n• image-editor make me look like a superhero\n• image-editor turn into cartoon style\n• image-editor convert to cyberpunk theme`
      },
      { quoted: m }
    )

    await conn.sendMessage(m.chat, { delete: wait.key })

  } catch (e) {
    console.log(e)
    await conn.sendMessage(m.chat, {
      edit: wait.key,
      text: "Failed to process the image. Please try again later."
    })
  }
}

handler.help = ["image-editor"]
handler.tags = ["ai"]
handler.command = /^(image-editor)$/i
handler.limit = true

export default handler
