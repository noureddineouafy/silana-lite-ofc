// @noureddine_ouafy
// Plugin: Video Resolution Enhancer (HD Upgrader)

import axios from "axios"
import FormData from "form-data"
import fs from "fs"
import path from "path"
import { writeFileSync } from 'fs'
import { fileTypeFromBuffer } from 'file-type'

const resolutions = {
  "480": "480",
  "720": "720",
  "1080": "1080",
  "2k": "1440",
  "4k": "2160",
  "8k": "4320"
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  conn.videohd = conn.videohd || {}
  if (m.sender in conn.videohd) throw "⏳ Please wait, your video is being processed."

  if (!text) throw `Example usage:\n${usedPrefix + command} 1080 60fps`

  let [res, fpsText] = text?.trim().toLowerCase().split(" ")
  let fps = 60

  if (fpsText && fpsText.endsWith("fps")) {
    fps = parseInt(fpsText.replace("fps", ""))
    if (isNaN(fps) || fps < 30 || fps > 240) {
      return m.reply("❗ FPS must be between 30 and 240 (example: 60fps)")
    }
  }

  const q = m.quoted ? m.quoted : m
  const mime = (q.msg || q).mimetype || q.mediaType || ''

  if (!/^video/.test(mime)) return m.reply("❗ Please reply to a video.")

  if (!resolutions[res]) {
    return m.reply(`Example usage:\n${usedPrefix + command} 720\n${usedPrefix + command} 1080 60fps`)
  }

  try {
    m.reply(`⏳ Converting video to ${res.toUpperCase()} at ${fps}FPS...`)
    const targetHeight = resolutions[res]
    const id = m.sender.split("@")[0]
    const inputPath = `./tmp/input_${id}.mp4`
    const outputPath = `./tmp/hdvideo_${id}.mp4`

    // ✅ Load video buffer and save manually
    const buffer = await q.download()
    const type = await fileTypeFromBuffer(buffer)
    const inputExt = type?.ext || "mp4"
    const inputFilePath = `./tmp/input_${id}.${inputExt}`
    writeFileSync(inputFilePath, buffer)

    conn.videohd[m.sender] = true

    const form = new FormData()
    form.append("video", fs.createReadStream(inputFilePath))
    form.append("resolution", targetHeight)
    form.append("fps", fps)

    const response = await axios.post("http://193.149.164.168:4167/hdvideo", form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      responseType: "stream"
    })

    const writer = fs.createWriteStream(outputPath)
    response.data.pipe(writer)

    writer.on("finish", async () => {
      const finalBuffer = fs.readFileSync(outputPath)
      await conn.sendMessage(m.chat, {
        video: finalBuffer,
        mimetype: 'video/mp4',
        fileName: path.basename(outputPath),
        caption: `✅ Video upgraded to ${res.toUpperCase()} ${fps}FPS`
      }, { quoted: m })

      delete conn.videohd[m.sender]
      fs.unlinkSync(inputFilePath)
      fs.unlinkSync(outputPath)
    })

  } catch (e) {
    delete conn.videohd[m.sender]
    return m.reply("❌ An error occurred: " + e.message)
  }
}

handler.help = handler.command = ["winkvideo"]
handler.tags = ["tools"]
handler.premium = false

export default handler
