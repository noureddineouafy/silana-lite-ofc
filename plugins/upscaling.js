// instagram.com/noureddine_ouafy
// scarape by Cifumo
import axios from 'axios'
import FormData from 'form-data'
import crypto from 'crypto'

let generateUsername = () => `${crypto.randomBytes(8).toString('hex')}_aiimglarger`

let upscaleImage = async (buffer, filename = 'temp.jpg', scale = 4, type = 0) => {
  try {
    let username = generateUsername()
    let form = new FormData()

    form.append('type', type)
    form.append('username', username)
    form.append('scaleRadio', scale.toString())
    form.append('file', buffer, { filename, contentType: 'image/jpeg' })

    let uploadRes = await axios.post('https://photoai.imglarger.com/api/PhoAi/Upload', form, {
      headers: {
        ...form.getHeaders(),
        'User-Agent': 'Dart/3.5 (dart:io)',
        'Accept-Encoding': 'gzip',
      },
    })

    let { code } = uploadRes.data.data
    let payload = { code, type, username, scaleRadio: scale.toString() }

    let result
    for (let i = 0; i < 1000; i++) {
      let statusRes = await axios.post('https://photoai.imglarger.com/api/PhoAi/CheckStatus', JSON.stringify(payload), {
        headers: {
          'User-Agent': 'Dart/3.5 (dart:io)',
          'Accept-Encoding': 'gzip',
          'Content-Type': 'application/json',
        },
      })

      result = statusRes.data.data
      if (result.status === 'success') break
      await new Promise(r => setTimeout(r, 500))
    }

    if (result.status === 'success') return result.downloadUrls[0]
    else throw new Error('Upscale failed after maximum retries.')
  } catch (e) {
    console.error('[Upscale Error]', e.message || e)
    return null
  }
}

let handler = async (m, { conn, args }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ''
  if (!mime.startsWith('image/')) return m.reply('المرجو الرد على صورة لتكبيرها')

  let img = await q.download()
  m.reply('المرجو الانتظار قليلاً...')

  let resultUrl = await upscaleImage(img)
  if (!resultUrl) return m.reply('فشل في معالجة الصورة.')

  await conn.sendFile(m.chat, resultUrl, 'upscaled.jpg', 'تم تكبير الصورة بنجاح', m)
}

handler.help = ['upscaling']
handler.tags = ['tools']
handler.command = /^upscaling$/i
handler.limit = true;
export default handler
