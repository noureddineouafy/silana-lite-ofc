// plugin by instagram.com/noureddine_ouafy
// scrape by NusanTech
import axios from 'axios'
import { parseStringPromise } from 'xml2js'

async function generateTextCraftImage(text, text2, text3) {
  const baseUrl = 'https://textcraft.net/gentext3.php'
  const query = new URLSearchParams({
    text,
    text2,
    text3,
    font_style: 'font1',
    font_size: 'x',
    font_colour: '0',
    bgcolour: '#2C262E',
    glow_halo: '0',
    glossy: '0',
    lighting: '0',
    fit_lines: '0',
    truecolour_images: '0',
    non_trans: 'false',
    glitter_border: 'true',
    text_border: '1',
    border_colour: '#2C262E',
    anim_type: 'none',
    submit_type: 'text',
    perspective_effect: '1',
    drop_shadow: '1',
    savedb: '0',
    multiline: '3',
    font_style2: 'font6',
    font_style3: 'font6',
    font_size2: 't',
    font_size3: 't',
    font_colour2: '68',
    font_colour3: '66',
    text_border2: '1',
    text_border3: '1',
    border_colour2: '#211E4E',
    border_colour3: '#EBD406'
  }).toString()

  const fullUrl = `${baseUrl}?${query}`

  const response = await axios.get(fullUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'text/html,application/xhtml+xml',
      'Referer': 'https://textcraft.net/'
    },
    timeout: 10000,
    responseType: 'text'
  })

  const parsed = await parseStringPromise(response.data)
  const filename = parsed.image.fullfilename[0]
  const datadir = parsed.image.datadir[0]
  return `https://static1.textcraft.net/${datadir}/${filename}`
}

let handler = async (m, { conn, args }) => {
  if (args.length < 3) {
    return m.reply('✳️ Please enter 3 text segments separated by commas:\n\nExample: .textcraft Hello, My Bot, Silana')
  }

  let [text1, text2, text3] = args.join(' ').split(',')

  try {
    m.reply('⏳ Please wait while I generate your image...')
    const imageUrl = await generateTextCraftImage(text1, text2, text3)
    await conn.sendFile(m.chat, imageUrl, 'textcraft.png', `✅ Here is your TextCraft image`, m)
  } catch (err) {
    console.error(err)
    m.reply('❌ Failed to generate image. Please try again later.')
  }
}

handler.help = ['textcraft']
handler.tags = ['tools']
handler.command = /^textcraft$/i
handler.limit = true
export default handler
