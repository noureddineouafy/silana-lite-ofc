/*
📌 Plugin: Text to Video (Brat Video)
📽️ Effect: كتابة النص تدريجياً وتحويله إلى فيديو
🎨 خصائص: اللون، الخلفية، البلور، السرعة
📥 الأمر: .brat [نص]
🧠 Instagram: @noureddine_ouafy
scrape by Fruatre
*/

import fs from 'fs'
import path from 'path'
import { createCanvas } from 'canvas'
import Jimp from 'jimp'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function colorize(ctx, width, colors) {
  if (Array.isArray(colors)) {
    let gradient = ctx.createLinearGradient(0, 0, width, 0)
    let step = 1 / (colors.length - 1)
    colors.forEach((color, index) => {
      gradient.addColorStop(index * step, color)
    })
    return gradient
  } else {
    return colors
  }
}

async function renderTextToBuffer(text, options = {}) {
  const width = 512
  const height = 512
  const margin = 20
  const wordSpacing = 25
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")
  ctx.fillStyle = colorize(ctx, width, options.background) || "white"
  ctx.fillRect(0, 0, width, height)
  let fontSize = 150
  const lineHeightMultiplier = 1.3
  ctx.textAlign = "left"
  ctx.textBaseline = "top"
  ctx.font = `${fontSize}px Sans-serif`
  const words = text.split(" ")
  const datas = words.map(() => options.color || "black")
  let lines = []
  function rebuildLines() {
    lines = []
    let currentLine = ""
    for (let word of words) {
      if (ctx.measureText(word).width > width - 2 * margin) {
        fontSize -= 2
        ctx.font = `${fontSize}px Sans-serif`
        return rebuildLines()
      }
      let testLine = currentLine ? `${currentLine} ${word}` : word
      let lineWidth =
        ctx.measureText(testLine).width +
        (currentLine.split(" ").length - 1) * wordSpacing
      if (lineWidth < width - 2 * margin) {
        currentLine = testLine
      } else {
        lines.push(currentLine)
        currentLine = word
      }
    }
    if (currentLine) lines.push(currentLine)
  }
  rebuildLines()
  while (lines.length * fontSize * lineHeightMultiplier > height - 2 * margin) {
    fontSize -= 2
    ctx.font = `${fontSize}px Sans-serif`
    rebuildLines()
  }
  const lineHeight = fontSize * lineHeightMultiplier
  let y = margin
  let i = 0
  for (let line of lines) {
    const wordsInLine = line.split(" ")
    let x = margin
    const space =
      (width - 2 * margin - ctx.measureText(wordsInLine.join("")).width) /
      (wordsInLine.length - 1)
    for (let word of wordsInLine) {
      ctx.fillStyle = colorize(ctx, ctx.measureText(word).width, datas[i])
      ctx.fillText(word, x, y)
      x += ctx.measureText(word).width + space
      i++
    }
    y += lineHeight
  }
  const buffer = canvas.toBuffer("image/png")
  if (options.blur) {
    const img = await Jimp.read(buffer)
    img.blur(options.blur)
    return await img.getBufferAsync(Jimp.MIME_PNG)
  }
  return buffer
}

async function makeBratVideo(text, {
  output = path.join(__dirname, 'brat_output.mp4'),
  background = "white",
  color = "black",
  blur = 1,
  speed = "normal"
} = {}) {
  const words = text.split(" ")
  const tmpDir = path.join(__dirname, "tmp_brat")
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)
  const framePaths = []
  for (let i = 0; i < words.length; i++) {
    const partial = words.slice(0, i + 1).join(" ")
    const buffer = await renderTextToBuffer(partial, { background, color, blur })
    const framePath = path.join(tmpDir, `frame_${i}.png`)
    fs.writeFileSync(framePath, buffer)
    framePaths.push(framePath)
  }
  const fileListPath = path.join(tmpDir, "filelist.txt")
  const duration = { fast: 0.4, normal: 1, slow: 1.6 }[speed] || 1
  let fileList = ""
  framePaths.forEach(f => {
    fileList += `file '${f}'\n`
    fileList += `duration ${duration}\n`
  })
  fileList += `file '${framePaths[framePaths.length - 1]}'\n`
  fileList += `duration 2\n`
  fs.writeFileSync(fileListPath, fileList)
  try {
    execSync(`ffmpeg -y -f concat -safe 0 -i "${fileListPath}" -vf "fps=30,format=yuv420p" "${output}"`)
  } catch (e) {
    throw "ffmpeg error: " + e.message
  }
  framePaths.forEach(f => fs.existsSync(f) && fs.unlinkSync(f))
  fs.existsSync(fileListPath) && fs.unlinkSync(fileListPath)
  fs.existsSync(tmpDir) && fs.rmdirSync(tmpDir)
  return output
}

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply('📥 أرسل النص بعد الأمر.\nمثال: .brat-vd  silana ai bot  ')

  m.reply("⏳ جاري إنشاء الفيديو... المرجو الانتظار قليلاً")

  try {
    const filePath = await makeBratVideo(text, {
      color: ["#ff0066", "#00ccff"],
      background: "white",
      blur: 1,
      speed: "normal"
    })

    await conn.sendFile(m.chat, filePath, 'brat_video.mp4', '📽️ تم إنشاء الفيديو بنجاح', m)
    fs.existsSync(filePath) && fs.unlinkSync(filePath)
  } catch (e) {
    m.reply('❌ حدث خطأ أثناء إنشاء الفيديو:\n' + e)
  }
}
handler.help = ['brat-vd']
handler.tags = ['tools']
handler.command = /^brat-vd$/i
handler.limit = true

export default handler
