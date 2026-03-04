// plugin by noureddine ouafy
// claud ai thanks hahahaha 

import axios from 'axios';
import baileys from '@adiwajshing/baileys';

const { generateWAMessageFromContent, proto } = baileys;

// ══════════════════════════════════════════════════════════════════
//  CONSTANTS
// ══════════════════════════════════════════════════════════════════
const FDROID_API    = 'https://f-droid.org/api/v1/packages';
const FDROID_REPO   = 'https://f-droid.org/repo';
const FDROID_SEARCH = 'https://search.f-droid.org';
const HEADERS       = { 'user-agent': 'Mozilla/5.0', accept: 'application/json' };

// ══════════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════════

/**
 * [EN] Send an interactive button list (WhatsApp nativeFlowMessage).
 *      Falls back to plain text if buttons fail.
 * [AR] إرسال قائمة أزرار تفاعلية. في حالة الفشل يرسل نصاً عادياً.
 */
async function sendButtonList(conn, m, { header, body, footer, title, rows, fallbackText }) {
  const buttonParamsJson = JSON.stringify({ title, sections: [{ title, rows }] });

  const content = {
    viewOnceMessage: {
      message: {
        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
          body:   { text: body },
          footer: { text: footer },
          header: { title: header, hasMediaAttachment: false },
          nativeFlowMessage: {
            buttons: [{ name: 'single_select', buttonParamsJson }]
          }
        })
      }
    }
  };

  try {
    const msg = generateWAMessageFromContent(m.chat, content, {
      userJid: conn.user?.id,
      quoted: m
    });
    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
  } catch {
    // Fallback plain text
    await m.reply(fallbackText);
  }
}

/**
 * [EN] Scrape F-Droid search page and return array of apps.
 * [AR] سكريب صفحة البحث في F-Droid وإرجاع قائمة التطبيقات.
 */
async function searchFDroid(query) {
  const url = `${FDROID_SEARCH}/?q=${encodeURIComponent(query)}&lang=en`;
  const { data } = await axios.get(url, { timeout: 20000, headers: HEADERS });

  const apps = [];

  // Try cheerio first, fallback to regex
  let cheerio;
  try { cheerio = (await import('cheerio')).default ?? (await import('cheerio')); } catch {}

  if (cheerio) {
    const $ = cheerio.load(data);
    $('a.package-header').each((i, el) => {
      if (apps.length >= 15) return false;
      const title   = $(el).find('.package-name').text().trim();
      const href    = $(el).attr('href') || '';
      const summary = $(el).find('.package-summary').text().trim();
      if (title && href) apps.push({ title, href, summary });
    });
  } else {
    const re = /href="(\/en\/packages\/([^"/?]+))"[^>]*?>[\s\S]*?class="package-name"[^>]*?>([\s\S]*?)<\/p>/g;
    let match;
    while ((match = re.exec(data)) !== null && apps.length < 15) {
      apps.push({
        title:   match[3].replace(/<[^>]+>/g, '').trim(),
        href:    match[1],
        summary: ''
      });
    }
  }

  return apps;
}

/**
 * [EN] Fetch app metadata from F-Droid official API.
 * [AR] جلب معلومات التطبيق من الـ API الرسمي لـ F-Droid.
 */
async function getPackageInfo(packageId) {
  const { data } = await axios.get(`${FDROID_API}/${packageId}`, {
    timeout: 20000,
    headers: HEADERS
  });
  return data;
}

// ══════════════════════════════════════════════════════════════════
//  COMMAND: .fdroid <query>  →  Search
// ══════════════════════════════════════════════════════════════════
async function handleSearch(m, conn, query) {
  if (!query) {
    return m.reply(
`❌ *Usage / الاستخدام:*
• \`.fdroid termux\`
• \`.fdroid whatsapp\`
• \`.fdroid firefox\`

[EN] Type an app name to search F-Droid.
[AR] اكتب اسم التطبيق للبحث في F-Droid.`
    );
  }

  await m.reply(`🔍 Searching for *${query}* on F-Droid...\nجاري البحث عن *${query}*...`);

  let apps;
  try {
    apps = await searchFDroid(query);
  } catch (e) {
    return m.reply(`❌ Search failed / فشل البحث: ${e.message}`);
  }

  if (!apps.length) {
    return m.reply(
`❌ No apps found for *${query}*
لم يتم العثور على تطبيقات لـ *${query}*`
    );
  }

  const rows = apps.map((app) => ({
    title:       app.title.slice(0, 24),
    description: (app.summary || 'F-Droid App').slice(0, 72),
    // [EN] When user selects → bot receives this as a message → fdroidl handler runs
    // [AR] عند اختيار المستخدم → البوت يستقبل هذا النص → يشتغل أمر fdroidl تلقائياً
    id: `.fdroidl https://f-droid.org${app.href}`
  }));

  const body =
`*🔍 F-DROID SEARCH RESULTS*

• *Query:* ${query}
• *Found:* ${apps.length} app${apps.length > 1 ? 's' : ''}

[EN] Select an app to see available versions.
[AR] اختر تطبيقاً لعرض الإصدارات المتاحة.`;

  let fallback = `🔍 *F-Droid: "${query}"*\n\n`;
  apps.forEach((app, i) => {
    fallback += `*${i + 1}.* ${app.title}\n▶ \`.fdroidl https://f-droid.org${app.href}\`\n\n`;
  });

  await sendButtonList(conn, m, {
    header:       '📦 F-Droid Apps',
    body,
    footer:       'F-Droid Search • No third-party API',
    title:        `Results: "${query}"`,
    rows,
    fallbackText: fallback
  });
}

// ══════════════════════════════════════════════════════════════════
//  COMMAND: .fdroidl <pkg> [| <idx>]  →  Version list / Download
// ══════════════════════════════════════════════════════════════════
async function handleDownload(m, conn, raw) {
  if (!raw) {
    return m.reply(
`❌ *Usage / الاستخدام:*
• \`.fdroidl com.termux\`
• \`.fdroidl org.mozilla.fenix\`
• \`.fdroidl https://f-droid.org/en/packages/com.termux\`
• \`.fdroidl com.termux | 0\`  ← direct index

[EN] Provide a package ID or F-Droid URL.
[AR] أدخل معرف الحزمة أو رابط F-Droid.`
    );
  }

  // ── Parse input ────────────────────────────────────────────────
  let packageId = '', pick = '';

  if (raw.includes('|')) {
    const parts = raw.split('|').map(v => v.trim());
    packageId = parts[0];
    pick      = parts[1] ?? '';
  } else {
    const parts = raw.split(/\s+/);
    packageId = parts[0];
    pick      = parts[1] ?? '';
  }

  // Extract packageId from URL if needed
  if (/^https?:\/\//i.test(packageId)) {
    const match = packageId.match(/\/packages\/([^/?#\s]+)/i);
    if (!match) return m.reply('❌ Invalid URL. Use package ID instead, e.g.: com.termux\nرابط غير صالح. استخدم معرف الحزمة مباشرة مثل: com.termux');
    packageId = match[1];
  }

  packageId = packageId.trim().replace(/\/+$/, '');
  if (!packageId) return m.reply('❌ Empty package ID / معرف الحزمة فارغ.');

  // ── Fetch from F-Droid API ─────────────────────────────────────
  let info;
  try {
    info = await getPackageInfo(packageId);
  } catch (e) {
    if (e?.response?.status === 404) {
      return m.reply(
`❌ App not found on F-Droid: *${packageId}*
التطبيق غير موجود في F-Droid: *${packageId}*`
      );
    }
    return m.reply(`❌ API Error: ${e.message}`);
  }

  const versions = Array.isArray(info?.packages) ? info.packages : [];
  if (!versions.length) return m.reply('❌ No APK versions found.\nلا توجد إصدارات APK.');

  const appName = String(info?.name || packageId).trim();
  const summary = String(info?.summary || '').trim();

  // ── No pick → show version list ────────────────────────────────
  if (pick === '' || pick === undefined) {
    const rows = versions.slice(0, 15).map((v, i) => {
      const sizeMB = v.size ? (v.size / 1024 / 1024).toFixed(1) + ' MB' : '-';
      return {
        title:       `v${v.versionName || v.versionCode}`,
        description: `Code: ${v.versionCode} • ${sizeMB}`,
        // [EN] Selecting triggers download with index i
        // [AR] الاختيار يشغل التحميل بالرقم i
        id: `.fdroidl ${packageId} | ${i}`
      };
    });

    const body =
`*📦 F-DROID DOWNLOADER*

• *App:* ${appName}
${summary ? `• *Info:* ${summary}` : ''}
• *Package:* \`${packageId}\`
• *Versions:* ${versions.length} available

[EN] Select a version to download the APK.
[AR] اختر إصداراً لتحميل ملف APK.`;

    let fallback = `📦 *${appName}* — Choose a version:\n\n`;
    versions.slice(0, 10).forEach((v, i) => {
      const sizeMB = v.size ? (v.size / 1024 / 1024).toFixed(1) + ' MB' : '-';
      fallback += `*${i}.* v${v.versionName || v.versionCode} — ${sizeMB}\n`;
      fallback += `▶ \`.fdroidl ${packageId} | ${i}\`\n\n`;
    });

    return await sendButtonList(conn, m, {
      header:       '📦 Select Version',
      body,
      footer:       'F-Droid Official API • No third-party',
      title:        '🔖 Available Versions',
      rows,
      fallbackText: fallback
    });
  }

  // ── Pick chosen → send APK ─────────────────────────────────────
  const idx     = Number.isFinite(Number(pick)) ? Number(pick) : 0;
  const chosen  = versions[idx] || versions[0];

  if (!chosen) return m.reply('❌ Version index not found.\nرقم الإصدار غير موجود.');

  const versionCode = chosen.versionCode;
  const versionName = String(chosen.versionName || versionCode);
  const sizeMB      = chosen.size ? (chosen.size / 1024 / 1024).toFixed(2) + ' MB' : '-';

  // [EN] F-Droid direct APK URL pattern (official, no third-party)
  // [AR] رابط APK المباشر من F-Droid الرسمي (بدون وسيط)
  const apkUrl  = `${FDROID_REPO}/${packageId}_${versionCode}.apk`;
  const fileName = `${appName.replace(/[^\w\s.\-()]/g, '')} v${versionName}.apk`;

  await m.reply(
`⏳ *Preparing download...*
جاري تجهيز التحميل...

• *App:* ${appName}
• *Version:* v${versionName}
• *Size:* ${sizeMB}`
  );

  try {
    await conn.sendMessage(
      m.chat,
      {
        document: { url: apkUrl },
        mimetype: 'application/vnd.android.package-archive',
        fileName,
        caption:
`✅ *APK Ready / ملف APK جاهز*

• *App / التطبيق:* ${appName}
• *Package:* \`${packageId}\`
• *Version / الإصدار:* v${versionName}
• *Size / الحجم:* ${sizeMB}
• *Source:* f-droid.org ✅`
      },
      { quoted: m }
    );
  } catch (e) {
    await m.reply(
`❌ *Failed to send file / فشل إرسال الملف*

[EN] Try downloading manually:
[AR] حاول التحميل يدوياً:
🔗 ${apkUrl}`
    );
  }
}

// ══════════════════════════════════════════════════════════════════
//  MAIN HANDLER — routes .fdroid vs .fdroidl
// ══════════════════════════════════════════════════════════════════
let handler = async (m, { conn, command, text }) => {
  const cmd = String(command || '').toLowerCase().trim();
  const arg = String(text || '').trim();

  if (cmd === 'fdroid' || cmd === 'fdr' || cmd === 'f-droid') {
    // Search mode
    await handleSearch(m, conn, arg);
  } else {
    // Download mode (.fdroidl)
    await handleDownload(m, conn, arg);
  }
};

handler.help    = ['fdroid'];
handler.tags    = ['downloader'];
handler.command = ['fdroid', 'fdr', 'f-droid', 'fdroidl'];
handler.limit   = false;

export default handler;
        
