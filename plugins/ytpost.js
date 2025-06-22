// instagram.com/noureddine_ouafy
// scrape by wolfyflutter
let handler = async (m, { conn, args }) => {
  if (!args[0]) return m.reply('❌ من فضلك أدخل رابط منشور يوتيوب.\nمثال:\n.ytpost http://youtube.com/post/Ugkxyo7NFjX9QWJky0WQQ7eEquJlkD3M6B0z?si=ImZCuBvQRA3Kmsl2');

  try {
    const result = await ytpost(args[0]);
    let message = `📌 *YouTube Post Info:*\n\n`;
    message += `👤 *Author:* ${result.author}\n`;
    message += `🔗 *Author URL:* ${result.authorUrl}\n`;
    message += `🕰️ *Published:* ${result.publishTime}\n`;
    message += `💬 *Text:* ${result.text}\n`;
    if (result.like) message += `👍 *Likes:* ${result.like}\n`;
    message += `📦 *Post Type:* ${result.postType}\n`;

    if (result.images) {
      for (let img of result.images) {
        await conn.sendFile(m.chat, img.url, 'ytimage.jpg', `${img.text || ''}`, m);
      }
    }

    if (result.videoShareUrl) {
      message += `🎥 *Video URL:* ${result.videoShareUrl}\n`;
    }

    m.reply(message);
  } catch (e) {
    console.error(e);
    m.reply('❌ حدث خطأ أثناء محاولة جلب بيانات المنشور.');
  }
};

handler.help = ['ytpost'];
handler.command = ['ytpost'];
handler.tags = ['tools'];
handler.limit = true;
export default handler;

// تابع ytpost
import fetch from 'node-fetch';

const ytpost = async (ytpostUrl) => {
  if (!ytpostUrl) throw Error(`❌ لم يتم إدخال رابط منشور يوتيوب.`);

  const response = await fetch(ytpostUrl);
  if (!response.ok) throw Error(`${response.status} ${response.statusText}\n${await response.text() || null}`);

  const html = await response.text();
  const match = html.match(/ytInitialData = (.+?);</)?.[1];
  if (!match) throw Error(`❌ تعذر استخراج البيانات. تأكد من صحة الرابط.`);

  const json = JSON.parse(match);
  let postType = null;
  let images = null;
  let videoShareUrl = null;

  const bpr = json.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].backstagePostThreadRenderer.post.backstagePostRenderer;

  const votePost = bpr?.backstageAttachment?.pollRenderer?.choices;
  const multipleImagePost = bpr?.backstageAttachment?.postMultiImageRenderer?.images;
  const singleImagePost = bpr?.backstageAttachment?.backstageImageRenderer?.image?.thumbnails;
  const videoSharePost = bpr?.backstageAttachment?.videoRenderer?.videoId;

  if (votePost) {
    let isVoteImage = false;
    images = votePost.map(v => {
      const text = v.text.runs[0].text;
      let url = v.image?.thumbnails || null;
      if (url) {
        url = url.map(i => i.url).pop();
        isVoteImage = true;
      }
      return { text, url };
    });
    postType = isVoteImage ? "voteImage" : "voteText";
  } else if (multipleImagePost) {
    postType = "multipleImages";
    const imagesArray = multipleImagePost.map(v => v.backstageImageRenderer.image.thumbnails);
    images = imagesArray.map(v => ({ url: v.map(i => i.url).pop(), text: null }));
  } else if (singleImagePost) {
    postType = "singleImage";
    images = [{
      url: singleImagePost.map(i => i.url).pop(),
      text: null
    }];
  } else if (videoSharePost) {
    postType = "videoShare";
    videoShareUrl = `https://www.youtube.com/watch?v=${videoSharePost}`;
  } else {
    postType = "text";
  }

  return {
    author: bpr.authorText.runs[0].text,
    authorUrl: `https://www.youtube.com${bpr.authorEndpoint.commandMetadata.webCommandMetadata.url}`,
    publishTime: bpr.publishedTimeText.runs[0].text,
    text: bpr.contentText.runs[0].text,
    like: bpr?.voteCount?.accessibility?.accessibilityData?.label || null,
    images,
    videoShareUrl,
    postType
  };
};
