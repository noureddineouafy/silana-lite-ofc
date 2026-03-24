import fetch from "node-fetch"
import FormData from "form-data"

// Convert bytes to readable size
function formatSize(bytes) {
  if (!bytes) return "0 B"
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i]
}

// Upload image to uguu
async function uguuUpload(buffer) {
  const form = new FormData()
  form.append("files[]", buffer, "file.jpg")

  const res = await fetch("https://uguu.se/upload.php", {
    method: "POST",
    headers: {
      accept: "*/*",
      "accept-language": "en-US",
      referer: "https://uguu.se/",
      ...form.getHeaders()
    },
    body: form
  })

  const json = await res.json()

  if (!json.success) {
    return { success: false, error: json }
  }

  const file = json.files[0]

  return {
    success: true,
    url: file.url,
    size: file.size
  }
}

// Send image to jpghd for enhancement
async function jpghdScrape(imageUrl) {
  const fakeIP = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 256)
  ).join('.')

  const baseHeaders = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
    'Origin': 'https://jpghd.com',
    'Referer': 'https://jpghd.com/en',
    'Cookie': 'jpghd_lng=en',
    'User-Agent': 'CT Android/1.1.0',
    'X-Forwarded-For': fakeIP,
    'X-Real-IP': fakeIP
  }

  // Create task
  const create = await fetch('https://jpghd.com/api/task/', {
    method: 'POST',
    headers: baseHeaders,
    body: `conf=${JSON.stringify({
      filename: imageUrl.split('/').pop(),
      livephoto: "",
      color: "",
      scratch: "",
      style: "art",
      input: imageUrl
    })}`
  })

  const createJson = await create.json()

  if (createJson.status !== 'ok') {
    return { status: false, message: 'Failed to create task' }
  }

  const tid = createJson.tid

  // Poll result
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 2000))

    const check = await fetch(`https://jpghd.com/api/task/${tid}`, {
      headers: {
        'Accept': 'application/json',
        'Referer': 'https://jpghd.com/en',
        'Cookie': 'jpghd_lng=en',
        'User-Agent': 'CT Android/1.1.0',
        'X-Forwarded-For': fakeIP,
        'X-Real-IP': fakeIP
      }
    })

    const checkJson = await check.json()
    const data = checkJson[tid]

    if (data?.status === 'success') {
      return {
        status: true,
        result: data.output.jpghd,
        size: data.output.size
      }
    }
  }

  return { status: false, message: 'Timeout, task not finished' }
}

// Main handler
let handler = async (m, { conn }) => {
  try {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || ""

    // Validate image
    if (!/image/.test(mime)) {
      throw "Reply to or send an image with command *.hdv3*"
    }

    // React loading
    await conn.sendMessage(m.chat, {
      react: { text: "⏳", key: m.key }
    })

    // Download image
    const buffer = await q.download()

    // Upload
    const upload = await uguuUpload(buffer)
    if (!upload.success) throw "Image upload failed"

    // Process HD
    const result = await jpghdScrape(upload.url)
    if (!result.status) throw result.message

    const size = formatSize(result.size)

    // Send result
    await conn.sendMessage(m.chat, {
      image: { url: result.result },
      caption: `✨ *HD Image successfully created*

📦 Size: ${size}`
    }, { quoted: m })

  } catch (e) {
    await conn.sendMessage(m.chat, {
      text: `❌ ${e}`
    }, { quoted: m })
  }
}

// Command info
handler.help = ['hdv3']
handler.tags = ['editor']
handler.command = /^(hdv3)$/i
export default handler
