// instagram.com/noureddine_ouafy
// scrape by Wolfyflutter's
let handler = async (m, { conn, args }) => {
  if (!args[0]) throw 'المرجو إرسال رابط منشور من إنستغرام.'

  try {
    const { name, username, images, videos } = await snapins(args[0])
    let caption = `*Author:* ${name}\n*Username:* @${username}`

    for (let img of images) {
      await conn.sendFile(m.chat, img, 'image.jpg', caption, m)
    }

    for (let vid of videos) {
      await conn.sendFile(m.chat, vid, 'video.mp4', caption, m)
    }

    if (images.length === 0 && videos.length === 0) {
      throw 'لم يتم العثور على صور أو فيديوهات في هذا الرابط.'
    }
  } catch (e) {
    throw `حدث خطأ أثناء جلب المنشور: ${e}`
  }
}

handler.help = handler.command = ['igpost']
handler.tags = ['downloader']
handler.limit = true
export default handler

// ======== function snapins ==========
const snapins = async (urlIgPost) => {
  const headers = {
    "content-type": "application/x-www-form-urlencoded",
  }

  const response = await fetch("https://snapins.ai/action.php", {
    headers,
    body: "url=" + encodeURIComponent(urlIgPost),
    method: "POST"
  })

  if (!response.ok) throw Error(`فشل في تحميل المعلومات: ${response.status} ${response.statusText}`)

  const json = await response.json()

  const name = json.data?.[0]?.author?.name || "(no name)"
  const username = json.data?.[0]?.author?.username || "(no username)"

  let images = []
  let videos = []

  json.data.map(v => {
    if (v.type === "image") {
      images.push(v.imageUrl)
    } else if (v.type === "video") {
      videos.push(v.videoUrl)
    }
  })

  return { name, username, images, videos }
}
