// plugin by noureddine ouafy
// scrape by Claude Ai

import axios from 'axios';

const API     = 'https://api.alquran.cloud/v1';
const TOTAL_AYAHS = 6236;

// أسماء السور الشائعة بالعربي → رقم السورة
const SURAH_MAP = {
  'الفاتحة': 1, 'البقرة': 2, 'آل عمران': 3, 'النساء': 4, 'المائدة': 5,
  'الأنعام': 6, 'الأعراف': 7, 'الأنفال': 8, 'التوبة': 9, 'يونس': 10,
  'هود': 11, 'يوسف': 12, 'الرعد': 13, 'إبراهيم': 14, 'الحجر': 15,
  'النحل': 16, 'الإسراء': 17, 'الكهف': 18, 'مريم': 19, 'طه': 20,
  'الأنبياء': 21, 'الحج': 22, 'المؤمنون': 23, 'النور': 24, 'الفرقان': 25,
  'الشعراء': 26, 'النمل': 27, 'القصص': 28, 'العنكبوت': 29, 'الروم': 30,
  'لقمان': 31, 'السجدة': 32, 'الأحزاب': 33, 'سبأ': 34, 'فاطر': 35,
  'يس': 36, 'الصافات': 37, 'ص': 38, 'الزمر': 39, 'غافر': 40,
  'فصلت': 41, 'الشورى': 42, 'الزخرف': 43, 'الدخان': 44, 'الجاثية': 45,
  'الأحقاف': 46, 'محمد': 47, 'الفتح': 48, 'الحجرات': 49, 'ق': 50,
  'الذاريات': 51, 'الطور': 52, 'النجم': 53, 'القمر': 54, 'الرحمن': 55,
  'الواقعة': 56, 'الحديد': 57, 'المجادلة': 58, 'الحشر': 59, 'الممتحنة': 60,
  'الصف': 61, 'الجمعة': 62, 'المنافقون': 63, 'التغابن': 64, 'الطلاق': 65,
  'التحريم': 66, 'الملك': 67, 'القلم': 68, 'الحاقة': 69, 'المعارج': 70,
  'نوح': 71, 'الجن': 72, 'المزمل': 73, 'المدثر': 74, 'القيامة': 75,
  'الإنسان': 76, 'المرسلات': 77, 'النبأ': 78, 'النازعات': 79, 'عبس': 80,
  'التكوير': 81, 'الانفطار': 82, 'المطففين': 83, 'الانشقاق': 84, 'البروج': 85,
  'الطارق': 86, 'الأعلى': 87, 'الغاشية': 88, 'الفجر': 89, 'البلد': 90,
  'الشمس': 91, 'الليل': 92, 'الضحى': 93, 'الشرح': 94, 'التين': 95,
  'العلق': 96, 'القدر': 97, 'البينة': 98, 'الزلزلة': 99, 'العاديات': 100,
  'القارعة': 101, 'التكاثر': 102, 'العصر': 103, 'الهمزة': 104, 'الفيل': 105,
  'قريش': 106, 'الماعون': 107, 'الكوثر': 108, 'الكافرون': 109, 'النصر': 110,
  'المسد': 111, 'الإخلاص': 112, 'الفلق': 113, 'الناس': 114,
};

// ═══════════════════════════════════════════════════════════════════════════
//  جلب الآية من API
//  alquran.cloud يدعم:
//  - editions/ar.aljalalayn  → تفسير الجلالين (عربي)
//  - editions/quran-uthmani  → نص عثماني
//  - editions/en.ahmedali    → معنى بالإنجليزي (نستخدمه كـ tafseer)
// ═══════════════════════════════════════════════════════════════════════════

async function fetchAyah(surah, ayah) {
  // جلب النص + التفسير + الترجمة بطلب واحد (multi-edition)
  const editions = 'quran-uthmani,ar.jalalayn,en.ahmedali';
  const res = await axios.get(
    `${API}/ayah/${surah}:${ayah}/editions/${editions}`,
    { timeout: 10000 }
  );

  const data = res.data?.data;
  if (!data || !Array.isArray(data)) throw new Error('رد غير متوقع من API');

  const arabic  = data.find(d => d.edition.identifier === 'quran-uthmani');
  const tafseer = data.find(d => d.edition.identifier === 'ar.jalalayn');
  const trans   = data.find(d => d.edition.identifier === 'en.ahmedali');

  return {
    surahNumber:  arabic?.surah?.number || surah,
    surahName:    arabic?.surah?.name   || '',
    surahNameEn:  arabic?.surah?.englishName || '',
    ayahNumber:   arabic?.numberInSurah || ayah,
    text:         arabic?.text          || '',
    tafseer:      tafseer?.text         || '',
    translation:  trans?.text           || '',
    juz:          arabic?.juz           || '',
    page:         arabic?.page          || '',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  رابط الصوت — EveryAyah CDN (مجاني، ماهر المعيقلي)
//  Pattern: https://everyayah.com/data/Maher_AlMuaiqly_64kbps/{surah3}{ayah3}.mp3
// ═══════════════════════════════════════════════════════════════════════════

function getAudioUrl(surah, ayah) {
  const s = String(surah).padStart(3, '0');
  const a = String(ayah).padStart(3, '0');
  return `https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/${s}${a}.mp3`;
}

// ═══════════════════════════════════════════════════════════════════════════
//  آية عشوائية
// ═══════════════════════════════════════════════════════════════════════════

async function getRandomAyah() {
  // نختار سورة عشوائية ثم آية عشوائية منها
  const surahNum = Math.floor(Math.random() * 114) + 1;
  const infoRes  = await axios.get(`${API}/surah/${surahNum}`, { timeout: 8000 });
  const count    = infoRes.data?.data?.numberOfAyahs || 1;
  const ayahNum  = Math.floor(Math.random() * count) + 1;
  return { surah: surahNum, ayah: ayahNum };
}

// ═══════════════════════════════════════════════════════════════════════════
//  تنسيق الرسالة
// ═══════════════════════════════════════════════════════════════════════════

function formatMessage(info) {
  let msg = '';
  msg += `🕌 *${info.surahName}*  •  الآية ${info.ayahNumber}\n`;
  msg += `📖 سورة ${info.surahNameEn}  •  جزء ${info.juz}  •  صفحة ${info.page}\n`;
  msg += `${'─'.repeat(30)}\n\n`;
  msg += `*${info.text}*\n\n`;

  if (info.tafseer) {
    msg += `${'─'.repeat(30)}\n`;
    msg += `📝 *التفسير (الجلالين):*\n`;
    // اختصار التفسير لو كان طويلاً
    const tafseerShort = info.tafseer.length > 300
      ? info.tafseer.slice(0, 300) + '...'
      : info.tafseer;
    msg += `${tafseerShort}\n\n`;
  }

  if (info.translation) {
    msg += `${'─'.repeat(30)}\n`;
    msg += `🌍 *المعنى (English):*\n`;
    const transShort = info.translation.length > 200
      ? info.translation.slice(0, 200) + '...'
      : info.translation;
    msg += `${transShort}\n`;
  }

  return msg;
}

// ═══════════════════════════════════════════════════════════════════════════
//  PARSE INPUT
// ═══════════════════════════════════════════════════════════════════════════

async function parseInput(raw) {
  if (!raw) {
    // عشوائي
    return await getRandomAyah();
  }

  // رقم سورة:رقم آية مثل "2:255"
  const colonMatch = raw.match(/^(\d+):(\d+)$/);
  if (colonMatch) {
    return { surah: parseInt(colonMatch[1]), ayah: parseInt(colonMatch[2]) };
  }

  // اسم سورة
  const surahNum = SURAH_MAP[raw.trim()];
  if (surahNum) {
    const infoRes = await axios.get(`${API}/surah/${surahNum}`, { timeout: 8000 });
    const count   = infoRes.data?.data?.numberOfAyahs || 1;
    const ayah    = Math.floor(Math.random() * count) + 1;
    return { surah: surahNum, ayah };
  }

  // رقم سورة فقط
  const numOnly = parseInt(raw);
  if (!isNaN(numOnly) && numOnly >= 1 && numOnly <= 114) {
    const infoRes = await axios.get(`${API}/surah/${numOnly}`, { timeout: 8000 });
    const count   = infoRes.data?.data?.numberOfAyahs || 1;
    const ayah    = Math.floor(Math.random() * count) + 1;
    return { surah: numOnly, ayah };
  }

  throw new Error(`لم أتعرف على "${raw}"\nمثال: .quran 2:255 أو .quran البقرة`);
}

// ═══════════════════════════════════════════════════════════════════════════
//  HANDLER
// ═══════════════════════════════════════════════════════════════════════════

let handler = async (m, { conn, text }) => {
  const raw = String(text || '').trim();

  await m.reply('🕌 جاري جلب الآية الكريمة...');

  let surah, ayah;
  try {
    const parsed = await parseInput(raw);
    surah = parsed.surah;
    ayah  = parsed.ayah;
  } catch (e) {
    return m.reply(`❌ ${e.message}`);
  }

  // تحقق من الأرقام
  if (surah < 1 || surah > 114)
    return m.reply('❌ رقم السورة يجب أن يكون بين 1 و 114');

  let info;
  try {
    info = await fetchAyah(surah, ayah);
  } catch (e) {
    return m.reply(`❌ فشل جلب الآية: ${e.message}`);
  }

  // ── إرسال النص ──
  const msg = formatMessage(info);
  await m.reply(msg);

  // ── إرسال صوت التلاوة ──
  const audioUrl = getAudioUrl(info.surahNumber, info.ayahNumber);
  try {
    await conn.sendMessage(
      m.chat,
      {
        audio:    { url: audioUrl },
        mimetype: 'audio/mpeg',
        ptt:      true,   // voice note
        fileName: `${info.surahName}_${info.ayahNumber}.mp3`,
      },
      { quoted: m }
    );
  } catch (_) {
    // لو الصوت فشل — أرسل الرابط فقط
    await m.reply(`🎵 *تلاوة عبد الرحمن السديس:*\n${audioUrl}`);
  }
};

// ── إرسال تلقائي كل يوم (لو أردت تفعيله من scheduler) ──
handler.cron = async (conn, chats) => {
  // يُستدعى من scheduler خارجي إذا وُجد
  // chats = قائمة المحادثات اللي تريد الإرسال فيها
};

handler.help = ['quran'];
handler.tags    = ['islamic'];
handler.command = ['quran'];

export default handler;
