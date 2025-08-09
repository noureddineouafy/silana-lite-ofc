import axios from 'axios'
import FormData from 'form-data'

let handler = async (m, { conn, args }) => {
  const q = m.quoted ? m.quoted : m
  const mime = (q.msg || q).mimetype || ''
  
  if (!mime) return m.reply('Send or reply to the file you want to upload.')
  
  m.reply('Please wait...')
  const media = await q.download()
  
  try {
    const form = new FormData()
    form.append('file', media, `file.${mime.split('/')[1]}`)
    const { data } = await axios.post('https://upload.gofile.io/uploadFile', form, {
      headers: form.getHeaders()
    })
    
    await m.reply(`${data.data.downloadPage}`)
  } catch (e) {
    m.reply(e.message)
  }
}

handler.help = ['gofile']
handler.command = ['gofile']
handler.tags = ['uploader']
handler.limit = true
export default handler
