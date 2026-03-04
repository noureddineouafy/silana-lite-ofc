// plugin by  noureddine ouafy 
// code by Claude ai

import axios from 'axios';

const AJ_URL = 'https://www.aljazeera.net/';
const HEADERS = {
  'user-agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
  'accept-language': 'ar,en;q=0.9',
  'accept': 'text/html,application/xhtml+xml'
};

// ═══════════════════════════════════════════════════════════════════════════
//  SCRAPE — extract breaking news from Al Jazeera homepage
// ═══════════════════════════════════════════════════════════════════════════
async function getBreakingNews() {
  const { data: html } = await axios.get(AJ_URL, { timeout: 20000, headers: HEADERS });

  const results = {
    mainHeadline: null,   // عنوان عاجل الرئيسي
    liveUpdates:  [],     // تحديثات التغطية المباشرة
    liveUrl:      null    // رابط التغطية المباشرة
  };

  // ── 1. Main "عاجل" headline ──────────────────────────────────────────
  // Pattern: <strong>عاجل</strong>...<h3...>HEADLINE</h3>
  const mainRe = /عاجل[\s\S]{0,300}?<h[123][^>]*>\s*([\s\S]+?)\s*<\/h[123]>/;
  const mainMatch = html.match(mainRe);
  if (mainMatch) {
    results.mainHeadline = mainMatch[1]
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Also try: <a href="...liveblog..."><h3>...</h3></a>
  if (!results.mainHeadline) {
    const altRe = /href="([^"]*liveblog[^"]*)"[^>]*>[\s\S]{0,200}?<h[123][^>]*>([\s\S]+?)<\/h[123]>/;
    const altMatch = html.match(altRe);
    if (altMatch) {
      results.mainHeadline = altMatch[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      results.liveUrl = 'https://www.aljazeera.net' + altMatch[1];
    }
  }

  // ── 2. Live blog URL ─────────────────────────────────────────────────
  if (!results.liveUrl) {
    const liveUrlRe = /href="(\/news\/liveblog\/[^"]+)"/;
    const liveUrlMatch = html.match(liveUrlRe);
    if (liveUrlMatch) results.liveUrl = 'https://www.aljazeera.net' + liveUrlMatch[1].split('?')[0];
  }

  // ── 3. Live updates (التغطية المباشرة bullet points) ─────────────────
  // Pattern: list items inside liveblog section with <h4> or <h3> tags
  const updateRe = /<h[34][^>]*>\s*<a[^>]*href="([^"]*liveblog[^"]*)"[^>]*>([\s\S]+?)<\/a>\s*<\/h[34]>/g;
  let match;
  while ((match = updateRe.exec(html)) !== null && results.liveUpdates.length < 8) {
    const title = match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (title && title.length > 10) {
      results.liveUpdates.push(title);
    }
  }

  // Fallback: grab any h4 inside a "تغطية مباشرة" block
  if (!results.liveUpdates.length) {
    const blockRe = /تغطية مباشرة[\s\S]{0,5000}?(?=اختيارات المحررين|class="article-card)/;
    const blockMatch = html.match(blockRe);
    if (blockMatch) {
      const block = blockMatch[0];
      const itemRe = /<h[34][^>]*>([\s\S]+?)<\/h[34]>/g;
      let m2;
      while ((m2 = itemRe.exec(block)) !== null && results.liveUpdates.length < 8) {
        const t = m2[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        if (t && t.length > 10) results.liveUpdates.push(t);
      }
    }
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
//  FORMAT message
// ═══════════════════════════════════════════════════════════════════════════
function formatMessage(data) {
  const now = new Date().toLocaleString('ar-MA', {
    timeZone: 'Africa/Casablanca',
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  let msg = '';
  msg += `🔴 *أخبار عاجلة — الجزيرة نت*\n`;
  msg += `📅 ${now}\n`;
  msg += `${'━'.repeat(30)}\n\n`;

  if (data.mainHeadline) {
    msg += `📌 *الخبر الرئيسي:*\n`;
    msg += `${data.mainHeadline}\n\n`;
  }

  if (data.liveUpdates.length > 0) {
    msg += `📡 *آخر تحديثات التغطية المباشرة:*\n`;
    msg += `${'┄'.repeat(28)}\n`;
    data.liveUpdates.forEach((item, i) => {
      msg += `${i + 1}. ${item}\n\n`;
    });
  }

  if (!data.mainHeadline && !data.liveUpdates.length) {
    msg += `😴 لا توجد أخبار عاجلة حالياً\n`;
    msg += `No breaking news at the moment.\n`;
  }

  msg += `${'━'.repeat(30)}\n`;
  msg += `🔗 aljazeera.net`;
  if (data.liveUrl) msg += `\n📺 ${data.liveUrl}`;

  return msg;
}

// ═══════════════════════════════════════════════════════════════════════════
//  HANDLER
// ═══════════════════════════════════════════════════════════════════════════
let handler = async (m) => {
  await m.reply(`⏳ جاري جلب الأخبار العاجلة من الجزيرة...`);

  let data;
  try {
    data = await getBreakingNews();
  } catch (e) {
    return m.reply(`❌ فشل الاتصال بالجزيرة نت:\n${e.message}`);
  }

  return m.reply(formatMessage(data));
};

handler.help    = ['aljazeera'];
handler.tags    = ['morocco'];
handler.command = ['aljazeera'];
export default handler;
