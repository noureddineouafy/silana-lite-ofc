// instagram.com/noureddine_ouafy

import axios from 'axios';
import cheerio from 'cheerio';

let handler = async (m, { text, conn }) => {
  if (!text) return m.reply('Please enter a search query.\nExample: .youtubesearch cat videos');
  
  let results = await searchYouTubeTop10(text);
  if (!results) return m.reply('No results found or an error occurred.');
  
  let msg = results.map((v, i) => `
${i + 1}. ${v.title}
📺 Channel: ${v.channel}
🔗 Link: ${v.url}
👁️ Views: ${v.views}
🕒 Published: ${v.published}
  `.trim()).join('\n\n');

  m.reply(msg);
};

handler.help = handler.command = ['youtubesearch'];
handler.tags = ['search'];
handler.limit = true;

export default handler;

// Function to scrape top 10 YouTube search results
async function searchYouTubeTop10(query) {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const { data } = await axios.get(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    const $ = cheerio.load(data);
    const scriptTags = $('script');
    const scriptTag = scriptTags.get().find(tag => $(tag).html().includes('var ytInitialData ='));
    if (!scriptTag) throw new Error('ytInitialData script tag not found.');

    const ytInitialDataRaw = $(scriptTag).html().match(/var ytInitialData = (.*?});/);
    if (!ytInitialDataRaw || ytInitialDataRaw.length < 2) throw new Error('Failed to extract ytInitialData.');

    const ytInitialData = JSON.parse(ytInitialDataRaw[1]);
    const contents = ytInitialData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    if (!contents) throw new Error('Search results not found.');

    const items = contents.find(x => x.itemSectionRenderer)?.itemSectionRenderer?.contents || [];
    const videos = items.filter(item => item.videoRenderer).slice(0, 10).map(item => {
      const video = item.videoRenderer;
      return {
        title: video.title?.runs?.[0]?.text || 'No title',
        videoId: video.videoId,
        url: `https://www.youtube.com/watch?v=${video.videoId}`,
        thumbnails: video.thumbnail?.thumbnails || [],
        channel: video.ownerText?.runs?.[0]?.text || 'Unknown',
        channelUrl: `https://www.youtube.com${video.ownerText?.runs?.[0]?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url || ''}`,
        views: video.viewCountText?.simpleText || 'No views',
        published: video.publishedTimeText?.simpleText || 'No date',
      };
    });
    return videos;
  } catch (error) {
    console.error('Error during YouTube scraping (Top 10):', error.message);
    return null;
  }
}
