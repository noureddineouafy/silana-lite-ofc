// instagram.com/noureddine_ouafy
// QR Code Generator Plugin
// Source: qr.io API
// Plugin to generate QR from text or URL
//  Fitur By Anomaki Team
// Created : xyzan code
import axios from 'axios'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

class CookieHandler {
  constructor() {
    this.cookies = {}
  }

  parseCookies(cookieString) {
    return cookieString.split(';').reduce((acc, pair) => {
      const [key, value] = pair.trim().split('=')
      if (key && value) acc[key] = decodeURIComponent(value)
      return acc
    }, {})
  }

  setCookies(setCookieHeader) {
    if (!setCookieHeader) return
    setCookieHeader.forEach(header => {
      const cookies = this.parseCookies(header.split(';')[0])
      Object.assign(this.cookies, cookies)
    })
  }

  getCookieString() {
    return Object.entries(this.cookies)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('; ')
  }
}

async function generateQR(input, type = 'text') {
  const cookieHandler = new CookieHandler()
  const headers = {
    'accept': 'application/json, text/plain, */*',
    'content-type': 'application/json',
    'origin': 'https://qr.io',
    'user-agent': 'Mozilla/5.0',
    'cookie': cookieHandler.getCookieString()
  }

  const baseData = {
    save_qr_code: 'no',
    backcolor: '#FFFFFF',
    frontcolor: '#000000',
    transparent: false,
    gradient: false,
    radial: false,
    gradient_color: '#15a97c',
    marker_out_color: '#000000',
    marker_in_color: '#000000',
    pattern: 'default',
    marker: 'default',
    marker_in: 'default',
    optionlogo: 'none',
    no_logo_bg: true,
    outer_frame: 'none',
    framelabel: 'SCAN ME',
    label_font: 'Arial, Helvetica, sans-serif',
    framecolor: '#000000'
  }

  const requestData = {
    ...baseData,
    section: type === 'text' ? 'text' : 'link',
    data: type === 'text' ? input : '',
    link: type === 'text' ? '' : input,
    mailto: '',
    subject: '',
    body: ''
  }

  try {
    if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp')

    const res = await axios.post('https://qr.io/generator2/ajax/process-index.php', requestData, { headers })
    if (!res.data.svgcode) throw new Error('No SVG code received')

    const svg = res.data.svgcode
    const filename = `qrcode_${Date.now()}.png`
    const filepath = path.join('./tmp', filename)

    await sharp(Buffer.from(svg)).resize(1023, 1023).png().toFile(filepath)

    return { filepath, filename, domain: res.data.domain || null }
  } catch (err) {
    throw new Error(`QR generation failed: ${err.message}`)
  }
}

let handler = async (m, { conn, args }) => {
  if (!args[0]) throw 'Please provide the text or URL.\nExample: .qr https://example.com'
  let type = args[0].startsWith('http') ? 'url' : 'text'

  m.reply('⏳ Generating QR Code, please wait...')

  try {
    const qr = await generateQR(args.join(' '), type)
    await conn.sendFile(m.chat, qr.filepath, qr.filename, `✅ QR Code Generated!\n📥 Type: ${type.toUpperCase()}`, m)
    fs.unlinkSync(qr.filepath)
  } catch (err) {
    throw err.message
  }
}

handler.help = handler.command = ['qr']
handler.tags = ['tools']
handler.limit = true

export default handler
