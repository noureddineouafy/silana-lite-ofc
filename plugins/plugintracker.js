/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║              🔍 PLUGIN TRACKER — silana-lite-ofc                         ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  COMMANDS / الأوامر                                                       ║
 * ║  ─────────────────────────────────────────────────────────────────────── ║
 * ║  .checkplugins          → بلوغينات زادت اليوم     / Added today          ║
 * ║  .checkplugins week     → بلوغينات زادت هذا الأسبوع / This week          ║
 * ║  .checkplugins 3        → بلوغينات آخر 3 أيام     / Last 3 days          ║
 * ║                                                                           ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  HOW IT WORKS / كيف يعمل                                                 ║
 * ║  ─────────────────────────────────────────────────────────────────────── ║
 * ║  [EN] 1. Bot calls GitHub Commits API for the plugins/ folder.           ║
 * ║       2. For each commit it checks which files were "added" (not edited). ║
 * ║       3. Groups results by day so the weekly view is easy to read.       ║
 * ║       4. No cache file needed — always live data from GitHub.            ║
 * ║                                                                           ║
 * ║  [AR] 1. البوت يستدعي GitHub Commits API على مجلد plugins/.              ║
 * ║       2. لكل كوميت يتحقق من الملفات اللي status ديالها "added" فقط.     ║
 * ║       3. يجمع النتائج حسب اليوم حتى يكون العرض الأسبوعي واضح.           ║
 * ║       4. لا يحتاج ملف كاش — البيانات دائماً مباشرة من GitHub.           ║
 * ║                                                                           ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  INSTALLATION / التثبيت                                                   ║
 * ║  ─────────────────────────────────────────────────────────────────────── ║
 * ║  [EN] 1. Drop this file into your bot's plugins/ folder.                 ║
 * ║       2. Make sure axios is installed:  npm install axios                 ║
 * ║       3. Done! No extra config needed.                                    ║
 * ║                                                                           ║
 * ║  [AR] 1. ضع هذا الملف داخل مجلد plugins/ ديال البوت.                    ║
 * ║       2. تأكد من تثبيت axios:  npm install axios                         ║
 * ║       3. خلاص! ما محتاجش إعداد إضافي.                                    ║
 * ║                                                                           ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  GITHUB API LIMITS / حدود GitHub API                                     ║
 * ║  ─────────────────────────────────────────────────────────────────────── ║
 * ║  [EN] Without a token: 60 requests/hour.                                 ║
 * ║       To increase to 5000/hour, add a GitHub token:                      ║
 * ║       Set GITHUB_TOKEN below with a Personal Access Token.               ║
 * ║       Get one at: https://github.com/settings/tokens                     ║
 * ║                                                                           ║
 * ║  [AR] بدون توكن: 60 طلب في الساعة.                                       ║
 * ║       لرفعه إلى 5000/ساعة، أضف توكن GitHub:                              ║
 * ║       غير GITHUB_TOKEN أسفله بـ Personal Access Token.                   ║
 * ║       احصل عليه من: https://github.com/settings/tokens                   ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import axios from 'axios';

// ═══════════════════════════════════════════════════════════════════════════
//  ⚙️  CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const GITHUB_USER   = 'noureddineouafy';
const GITHUB_REPO   = 'silana-lite-ofc';
const GITHUB_BRANCH = 'master';
const PLUGINS_PATH  = 'plugins';

/**
 * [EN] Optional: Add your GitHub Personal Access Token to avoid rate limits.
 *      Leave as empty string '' to use without token (60 req/hour).
 * [AR] اختياري: أضف GitHub Token لتجنب حدود الطلبات.
 *      اتركه فارغاً '' للاستخدام بدون توكن (60 طلب/ساعة).
 */
const GITHUB_TOKEN = ''; // ← ضع توكنك هنا إذا أردت (اختياري)

const REPO_URL = `https://github.com/${GITHUB_USER}/${GITHUB_REPO}/tree/${GITHUB_BRANCH}/${PLUGINS_PATH}`;

// ═══════════════════════════════════════════════════════════════════════════
//  DAYS OF WEEK / أيام الأسبوع
// ═══════════════════════════════════════════════════════════════════════════

const DAY_NAMES = {
  0: { ar: 'الأحد',     en: 'Sunday'    },
  1: { ar: 'الإثنين',   en: 'Monday'    },
  2: { ar: 'الثلاثاء',  en: 'Tuesday'   },
  3: { ar: 'الأربعاء',  en: 'Wednesday' },
  4: { ar: 'الخميس',    en: 'Thursday'  },
  5: { ar: 'الجمعة',    en: 'Friday'    },
  6: { ar: 'السبت',     en: 'Saturday'  },
};

// ═══════════════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function buildHeaders() {
  const h = { 'user-agent': 'Mozilla/5.0', accept: 'application/vnd.github+json' };
  if (GITHUB_TOKEN) h['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
  return h;
}

/** Format date as DD/MM/YYYY */
function fmtDate(d) {
  return d.toLocaleDateString('fr-MA');
}

/** Format time as HH:MM */
function fmtTime(d) {
  return d.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' });
}

/** Get YYYY-MM-DD key for grouping */
function dayKey(d) {
  return d.toISOString().slice(0, 10);
}

/** Is date "today"? */
function isToday(d) {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
         d.getMonth()    === now.getMonth()    &&
         d.getDate()     === now.getDate();
}

// ═══════════════════════════════════════════════════════════════════════════
//  CORE — Fetch newly added plugins since X days ago
// ═══════════════════════════════════════════════════════════════════════════

async function getNewPluginsSince(days = 1) {
  const headers = buildHeaders();

  // Start of day X days ago
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  // ── Step 1: Get commit SHAs ──────────────────────────────────────────
  const commitsUrl =
    `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/commits` +
    `?sha=${GITHUB_BRANCH}&path=${PLUGINS_PATH}&since=${since.toISOString()}&per_page=100`;

  const { data: commits } = await axios.get(commitsUrl, { timeout: 20000, headers });

  if (!commits.length) return new Map();

  // ── Step 2: For each commit, get added files ─────────────────────────
  // Map: dayKey → [ { name, time, commitMsg } ]
  const byDay = new Map();

  for (const c of commits) {
    const { data: detail } = await axios.get(
      `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/commits/${c.sha}`,
      { timeout: 20000, headers }
    );

    const date      = new Date(detail.commit.author.date);
    const commitMsg = detail.commit.message.split('\n')[0].trim();
    const key       = dayKey(date);

    for (const file of detail.files || []) {
      if (file.status !== 'added') continue;
      if (!file.filename.startsWith(PLUGINS_PATH + '/')) continue;

      const name = file.filename.slice(PLUGINS_PATH.length + 1);
      if (name.includes('/')) continue; // skip subfolders

      if (!byDay.has(key)) byDay.set(key, []);

      // Avoid duplicates within same day
      const dayList = byDay.get(key);
      if (!dayList.find(p => p.name === name)) {
        dayList.push({ name, date, commitMsg });
      }
    }
  }

  // Sort each day's plugins by time desc
  for (const [, list] of byDay) {
    list.sort((a, b) => b.date - a.date);
  }

  // Return as sorted Map (newest day first)
  return new Map([...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0])));
}

// ═══════════════════════════════════════════════════════════════════════════
//  FORMAT — Build the reply message
// ═══════════════════════════════════════════════════════════════════════════

function formatMessage(byDay, days) {
  const totalPlugins = [...byDay.values()].reduce((s, l) => s + l.length, 0);
  const label        = days === 1 ? 'اليوم / Today' : `آخر ${days} أيام / Last ${days} days`;

  if (!totalPlugins) {
    return (
`😴 *ما زادش نورالدين والو!*
*No new plugins added!*

• *الفترة / Period:* ${label}
• *Repo:* ${GITHUB_USER}/${GITHUB_REPO}

🔗 ${REPO_URL}`
    );
  }

  // Header
  let msg = '';
  msg += `╔══════════════════════════╗\n`;
  msg += `║   🆕 بلوغينات جديدة      ║\n`;
  msg += `║   New Plugins Added      ║\n`;
  msg += `╚══════════════════════════╝\n\n`;
  msg += `📁 *${GITHUB_USER}/${GITHUB_REPO}*\n`;
  msg += `📅 *${label}*\n`;
  msg += `📦 *المجموع / Total: ${totalPlugins} plugin${totalPlugins > 1 ? 's' : ''}*\n`;
  msg += `${'─'.repeat(30)}\n\n`;

  // One section per day
  for (const [key, plugins] of byDay) {
    const d       = new Date(key + 'T12:00:00Z');
    const dayNum  = d.getUTCDay();
    const dayAr   = DAY_NAMES[dayNum].ar;
    const dayEn   = DAY_NAMES[dayNum].en;
    const todayBadge = isToday(new Date(key + 'T12:00:00')) ? ' ◀ اليوم' : '';

    msg += `📆 *${dayAr} / ${dayEn} — ${fmtDate(new Date(key + 'T12:00:00Z'))}${todayBadge}*\n`;
    msg += `   ${plugins.length} plugin${plugins.length > 1 ? 's' : ''}\n`;
    msg += `${'┄'.repeat(28)}\n`;

    plugins.forEach((p, i) => {
      msg += `  *${i + 1}.* \`${p.name}\`\n`;
      msg += `       🕐 ${fmtTime(p.date)}\n`;
      msg += `       💬 ${p.commitMsg}\n`;
    });

    msg += '\n';
  }

  msg += `${'─'.repeat(30)}\n`;
  msg += `🔗 ${REPO_URL}`;

  return msg;
}

// ═══════════════════════════════════════════════════════════════════════════
//  HANDLER
// ═══════════════════════════════════════════════════════════════════════════

let handler = async (m, { text }) => {
  const arg = String(text || '').trim().toLowerCase();

  // Parse days: "week" = 7, number = that number, default = 1
  let days;
  if (arg === 'week' || arg === 'أسبوع' || arg === 'اسبوع') {
    days = 7;
  } else if (arg && !isNaN(parseInt(arg))) {
    days = Math.min(30, Math.max(1, parseInt(arg))); // max 30 days
  } else {
    days = 1;
  }

  const label = days === 7 ? 'الأسبوع / Week'
              : days === 1 ? 'اليوم / Today'
              : `آخر ${days} أيام / Last ${days} days`;

  await m.reply(`🔍 كانبحث على بلوغينات نورالدين (${label})...`);

  let byDay;
  try {
    byDay = await getNewPluginsSince(days);
  } catch (e) {
    // Friendly error messages
    if (e?.response?.status === 403) {
      return m.reply(
`⚠️ *GitHub API rate limit reached!*
وصلنا لحد الطلبات ديال GitHub.

[EN] Add a GitHub token in the plugin config to fix this.
[AR] أضف GitHub Token في إعدادات البلوغين لحل المشكلة.
🔗 https://github.com/settings/tokens`
      );
    }
    return m.reply(`❌ GitHub API error: ${e.message}`);
  }

  return m.reply(formatMessage(byDay, days));
};

handler.help = ['plugintracker'];
handler.tags    = ['owner', 'tools'];
handler.command = ['plugintracker'];

export default handler;
  
