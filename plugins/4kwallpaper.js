// modified by : noureddine_ouafy
// scrape by GilangSan
import axios from 'axios'
import cheerio from 'cheerio'

class Wallpaper {
  constructor() {
    this.base = 'https://4kwallpapers.com'
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
    }
  }

  async search(q) {
    if (!q) return 'Missing query.'
    try {
      let { data } = await axios.get(`${this.base}/search/?text=${q}`, {
        headers: this.headers
      })
      const $ = cheerio.load(data)
      let res = []
      $('div#pics-list .wallpapers__item').each((i, e) => {
        res.push({
          thumbnail: $(e).find('img').attr('src'),
          title: $(e).find('.title2').text().trim(),
          url: $(e).find('a').attr('href')
        })
      })
      return res
    } catch (e) {
      return e.message
    }
  }

  async download(url) {
    if (!url) return 'Missing wallpaper URL.'
    try {
      let { data } = await axios.get(url, { headers: this.headers })
      const $ = cheerio.load(data)
      const main = $('#main-pic')
      const list = $('#res-list')
      let res = {
        title: $('.main-id .selected').text().trim(),
        thumbnail: $(main).find('img').attr('src'),
        image: {
          desktop: [],
          mobile: [],
          tablet: []
        }
      }
      $(list).find('span').eq(0).find('a').each((i, e) => {
        res.image.desktop.push({
          res: $(e).text().trim(),
          url: this.base + $(e).attr('href')
        })
      })
      $(list).find('span').eq(1).find('a').each((i, e) => {
        res.image.mobile.push({
          res: $(e).text().trim(),
          url: this.base + $(e).attr('href')
        })
      })
      $(list).find('span').eq(2).find('a').each((i, e) => {
        res.image.tablet.push({
          res: $(e).text().trim(),
          url: this.base + $(e).attr('href')
        })
      })
      return res
    } catch (e) {
      return e.message
    }
  }
}

let handler = async (m, { conn, args }) => {
  const wallpaper = new Wallpaper()
  const type = args[0]

  if (!type) {
    return m.reply(`📌 *كيفية استخدام أمر 4kwallpaper*:

✅ لعرض الخلفيات حسب التصنيف:
• .4kwallpaper popular
• .4kwallpaper featured
• .4kwallpaper random
• .4kwallpaper collection

🔍 للبحث عن خلفية:
• .4kwallpaper search nature
• .4kwallpaper search car

📥 لتحميل الخلفية:
1. ابحث عن الخلفية أو اختر رابطاً من النتائج.
2. ثم أرسل الأمر التالي:
• .4kwallpaper dl https://4kwallpapers.com/...

✳️ ملاحظة: سيتم إرسال روابط التحميل التي يمكنك الضغط عليها لتنزيل الصور بدقة عالية.
`)
  }

  if (['popular', 'featured', 'random', 'collection'].includes(type)) {
    let { data } = await axios.get(`${wallpaper.base}/${type === 'popular' ? 'most-popular-4k-wallpapers/' : type === 'featured' ? 'best-4k-wallpapers/' : type === 'random' ? 'random-wallpapers/' : 'collections-packs/'}`, {
      headers: wallpaper.headers
    })
    const $ = cheerio.load(data)
    let result = []
    $('div#pics-list .wallpapers__item').each((i, e) => {
      if (i < 5) result.push(`*${i + 1}. ${$(e).find('.title2').text().trim()}*\n🔗 ${$(e).find('a').attr('href')}`)
    })
    return m.reply(`🌆 *خلفيات (${type})*\n\n${result.join('\n\n')}\n\n📥 لا تنسَ أنه يمكنك تحميل أي واحدة باستخدام:\n.4kwallpaper dl [الرابط]`)
  }

  if (type === 'search') {
    if (!args[1]) {
      return m.reply(`❌ أكتب كلمة للبحث.\nمثال:\n.4kwallpaper search ocean`)
    }
    let query = args.slice(1).join(' ')
    let data = await wallpaper.search(query)
    if (typeof data === 'string') return m.reply(data)
    let result = data.slice(0, 5).map((item, i) => `*${i + 1}. ${item.title}*\n🔗 ${item.url}`).join('\n\n')
    return m.reply(`🔎 *نتائج البحث عن:* ${query}\n\n${result}\n\n📥 لتحميل خلفية:\n.4kwallpaper dl [الرابط]`)
  }

  if (type === 'dl') {
    if (!args[1]) return m.reply('❌ أرسل رابط خلفية صالح.\nمثال:\n.4kwallpaper dl https://4kwallpapers.com/...')
    let data = await wallpaper.download(args[1])
    if (typeof data === 'string') return m.reply(data)
    let msg = `✅ *${data.title}*\n\n🖼 معاينة:\n${data.thumbnail}\n\n🖥 *دقات سطح المكتب:*\n${data.image.desktop.map(x => `${x.res}: ${x.url}`).join('\n')}`
    return m.reply(msg)
  }

  return m.reply('❌ الأمر غير معروف. أرسل فقط `.4kwallpaper` للحصول على شرح الاستخدام.')
}

handler.help = ['4kwallpaper']
handler.tags = ['downloader']
handler.command = ['4kwallpaper']
handler.limit = true

export default handler
