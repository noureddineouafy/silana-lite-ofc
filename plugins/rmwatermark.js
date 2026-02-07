// plugin by instagram.com/noureddine_ouafy
// scrape by ZenzzXD

import fs from 'fs'
import axios from 'axios'
import FormData from 'form-data'

async function ezremove(path) {
  const form = new FormData()
  form.append('image_file', fs.createReadStream(path), path.split('/').pop())

  const create = await axios.post(
    'https://api.ezremove.ai/api/ez-remove/watermark-remove/create-job',
    form,
    {
      headers: {
        ...form.getHeaders(),
        'User-Agent': 'Mozilla/5.0',
        origin: 'https://ezremove.ai',
        'product-serial': 'sr-' + Date.now()
      }
    }
  ).then(v => v.data).catch(() => null)

  if (!create || !create.result || !create.result.job_id) {
    return { status: 'error' }
  }

  const job = create.result.job_id

  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 2000))

    const check = await axios.get(
      `https://api.ezremove.ai/api/ez-remove/watermark-remove/get-job/${job}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          origin: 'https://ezremove.ai',
          'product-serial': 'sr-' + Date.now()
        }
      }
    ).then(v => v.data).catch(() => null)

    if (check && check.code === 100000 && check.result && check.result.output) {
      return { job, result: check.result.output[0] }
    }

    if (!check || !check.code || check.code !== 300001) break
  }

  return { status: 'processing', job }
}

// ==================================================================
// ========================= HANDLER BELOW ===========================
// ==================================================================

let handler = async (m, { conn }) => {
  if (!m.quoted || !m.quoted.mimetype) {
    return m.reply(`❗ Please reply to an image with the command.`)
  }

  let media = await m.quoted.download()
  let path = './tmp/ezremove-' + Date.now() + '.jpg'
  fs.writeFileSync(path, media)

  m.reply(`⏳ **Removing watermark... please wait**`)

  let output = await ezremove(path)

  if (!output || output.status === 'error') {
    fs.unlinkSync(path)
    return m.reply(`❌ Failed to process the image.\nTry again later.`)
  }

  if (output.status === 'processing') {
    fs.unlinkSync(path)
    return m.reply(`⚠️ The job is still processing. Try again with job id: ${output.job}`)
  }

  // send result
  await conn.sendFile(
    m.chat,
    output.result,
    'watermark-removed.png',
    `✅ **Watermark successfully removed!**\nJob ID: *${output.job}*`,
    m
  )

  fs.unlinkSync(path)
}

handler.help = handler.command = ['rmwatermark']
handler.tags = ['editor']
handler.limit = true

export default handler
