/*
📌 Feature: Send Email (Lemon Email)
🏷️ Type: Plugin ESM
🔗 Source: https://whatsapp.com/channel/0029Vb6Zs8yEgGfRQWWWp639
✍️ Author: ZenzzXD
📝 Modified by: noureddine_ouafy
*/

import axios from 'axios'

const templates = [
  'default',
  'dark',
  'struck',
  'notificationBox',
  'juiceBox',
  'corporateClean',
  'artsyBorder',
  'receiptStyle',
  'magazineClassic',
  'luxuryPromo',
  'minimalMono'
]

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    const templateList = templates.map(t => `- ${t}`).join('\n')
    throw `📬 *Send Email Command*

📌 *Usage:*
${usedPrefix + command} email@example.com|template_name|your message here

🧾 *Example:*
${usedPrefix + command} test@example.com|notificationBox|Hello, this is a test message

🎨 *Available Templates:*
${templateList}`
  }

  const [emailRaw, templateRaw, ...messageArr] = text.split('|')
  const to = emailRaw.trim()
  const template = templateRaw?.trim()
  const message = messageArr.join('|').trim()

  if (!to.includes('@') || !template || !message) {
    const templateList = templates.map(t => `- ${t}`).join('\n')
    throw `❌ *Invalid format!*

📌 *Correct Usage:*
${usedPrefix + command} email@example.com|template_name|your message here

🎨 *Available Templates:*
${templateList}`
  }

  if (!templates.includes(template)) {
    const templateList = templates.map(t => `- ${t}`).join('\n')
    throw `❌ *Template "${template}" is not valid!*

🎨 *Available Templates:*
${templateList}`
  }

  const payload = {
    to,
    subject: to,
    message,
    template
  }

  const headers = {
    'Content-Type': 'application/json',
    'Origin': 'https://lemon-email.vercel.app',
    'Referer': 'https://lemon-email.vercel.app/',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
  }

  try {
    const res = await axios.post('https://lemon-email.vercel.app/send-email', payload, { headers })
    if (res.data.message?.toLowerCase().includes('similar email was recently sent')) {
      m.reply('⚠️ A similar email was sent recently. Please change the email or wait a bit.')
    } else {
      m.reply(`✅ Email sent successfully to: *${to}*`)
    }
  } catch (err) {
    m.reply(`❌ Error sending email:\n${err.response ? err.response.data.message : err.message}`)
  }
}

handler.help = ['sendemail']
handler.tags = ['tools']
handler.command = ['sendemail']
handler.limit = true 
export default handler
