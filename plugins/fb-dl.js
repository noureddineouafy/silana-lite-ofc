// instagram.com/noureddine_ouafy
// scrape by wolfyflutter
import fetch from 'node-fetch'

const fbvdl = async (fbVideoUrl) => {
  const headers = {
    'sec-fetch-site': 'same-origin'
  }

  // Get redirect header to extract video ID
  const fr = await fetch(fbVideoUrl, {
    headers,
    method: 'head'
  })

  if (!fr.ok) throw new Error(`Failed to fetch redirect: ${fr.status} ${fr.statusText}`)

  const videoId = fr.headers.get('link')?.match(/\/(\d+)\/>;/)?.[1]
  if (!videoId) throw new Error(`Video ID not found. Maybe the link is private or invalid.`)

  // Prepare body for Facebook GraphQL API
  let body_obj = {
    caller: 'TAHOE',
    entityNumber: 5,
    feedbackSource: 41,
    feedLocation: 'TAHOE',
    focusCommentID: null,
    isCrawler: false,
    isLoggedOut: true,
    privacySelectorRenderLocation: 'COMET_STREAM',
    renderLocation: 'video_home',
    scale: 1,
    useDefaultActor: false,
    videoID: videoId,
    videoIDStr: videoId,
    __relay_internal__pv__CometUFIShareActionMigrationrelayprovider: true,
    __relay_internal__pv__GHLShouldChangeSponsoredDataFieldNamerelayprovider: false,
    __relay_internal__pv__IsWorkUserrelayprovider: false
  }

  const body = new URLSearchParams({
    variables: JSON.stringify(body_obj),
    doc_id: '23880857301547365'
  })

  const res = await fetch('https://www.facebook.com/api/graphql/', {
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
      ...headers
    },
    body,
    method: 'POST'
  })

  const text = await res.text()
  const json = JSON.parse(text.split('\n')[0])
  const media = json.data.video.story.attachments[0].media

  return {
    sdUrl: media.videoDeliveryLegacyFields.browser_native_sd_url,
    hdUrl: media.videoDeliveryLegacyFields.browser_native_hd_url,
    audioUrl: json.extensions.all_video_dash_prefetch_representations[0].representations[2].base_url,
    thumbnailUrl: media.preferred_thumbnail.image.uri,
    sprites: media?.video_player_scrubber_preview_renderer?.video?.scrubber_preview_thumbnail_information?.sprite_uris || null,
    permalinkUrl: media.permalink_url,
    publishTime: media.publish_time,
    durationInMs: media.playable_duration_in_ms
  }
}

let handler = async (m, { conn, args }) => {
  if (!args[0]) throw '📌 أرسل رابط فيديو فيسبوك بعد الأمر'

  try {
    const result = await fbvdl(args[0])

    let caption = `🎬 *Facebook Video Downloader*

📺 *HD:* ${result.hdUrl ? 'Available ✅' : 'Unavailable ❌'}
📺 *SD:* ${result.sdUrl ? 'Available ✅' : 'Unavailable ❌'}
🕐 *Duration:* ${Math.round(result.durationInMs / 1000)} seconds
🔗 *Permalink:* ${result.permalinkUrl}
🗓️ *Published:* ${new Date(result.publishTime * 1000).toLocaleString()}`

    await conn.sendFile(m.chat, result.hdUrl || result.sdUrl, 'fbvideo.mp4', caption, m)
  } catch (err) {
    m.reply('❌ فشل في تحميل الفيديو. تأكد من أن الرابط عام وليس خاص.\n\n' + err.message)
  }
}

handler.help = ['fb-dl']
handler.tags = ['downloader']
handler.command = /^fb-dl$/i
handler.limit = true

export default handler
