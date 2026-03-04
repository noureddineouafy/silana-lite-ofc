/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║              ✨ TEXTTRICK — Fancy Text Styles                             ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  COMMANDS / الأوامر                                                       ║
 * ║  .texttrick <text>       → 5 styles: Neg.Squared, SmallCaps,             ║
 * ║                            Mirror, Cyber, Mystic                          ║
 * ║  .fancy <text>           → same / نفس الشيء                              ║
 * ║  .tt <text>              → shortcut                                       ║
 * ║                                                                           ║
 * ║  EXAMPLE / مثال:                                                          ║
 * ║  .texttrick silana                                                        ║
 * ║  → 🆂🅸🅻🅰🅽🅰   ꜱɪʟᴀɴᴀ   ɐuɐʃıs   ｓｉｌａｎａ   s҉i҉l҉a҉n҉a҉            ║
 * ║                                                                           ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║                                                                           ║
 * ║  HOW IT WORKS / كيف يعمل                                                 ║
 * ║  [EN] Pure Unicode transformations — no API, no scraping, no internet.   ║
 * ║       Each style maps characters to Unicode equivalents locally.          ║
 * ║  [AR] تحويلات Unicode محلية — بلا API ولا إنترنت ولا مكتبات خارجية.     ║
 * ║       كل style عندها خريطة Unicode محلية في الكود مباشرة.                ║
 * ║                                                                           ║
 * ║  INSTALL / التثبيت                                                        ║
 * ║  لا شيء — zero dependencies! / Nothing — zero dependencies!              ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════
//  UNICODE STYLE MAPS
// ═══════════════════════════════════════════════════════════════════════════

// 1. Negative Squared 🆂🅸🅻🅰🅽🅰
function negativeSquared(text) {
  const map = {
    a:'\u{1F170}',b:'\u{1F171}',c:'\u{1F172}',d:'\u{1F173}',e:'\u{1F174}',
    f:'\u{1F175}',g:'\u{1F176}',h:'\u{1F177}',i:'\u{1F178}',j:'\u{1F179}',
    k:'\u{1F17A}',l:'\u{1F17B}',m:'\u{1F17C}',n:'\u{1F17D}',o:'\u{1F17E}',
    p:'\u{1F17F}',q:'🆀',r:'🆁',s:'🆂',t:'🆃',u:'🆄',
    v:'🆅',w:'🆆',x:'🆇',y:'🆈',z:'🆉',
    '0':'🄋','1':'➊','2':'➋','3':'➌','4':'➍',
    '5':'➎','6':'➏','7':'➐','8':'➑','9':'➒',
    ' ': ' '
  };
  return [...text.toLowerCase()].map(c => map[c] || c).join('');
}

// 2. Small Caps ꜱɪʟᴀɴᴀ
function smallCaps(text) {
  const map = {
    a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ꜰ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',
    k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'Q',r:'ʀ',s:'ꜱ',t:'ᴛ',
    u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ'
  };
  return [...text.toLowerCase()].map(c => map[c] || c).join('');
}

// 3. Mirror ɐuɐʃıs (reverse + flip)
function mirror(text) {
  const map = {
    a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ɓ',h:'ɥ',i:'ı',j:'ɾ',
    k:'ʞ',l:'ʃ',m:'ɯ',n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',
    u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z',
    A:'∀',B:'q',C:'Ɔ',D:'p',E:'Ǝ',F:'Ⅎ',G:'פ',H:'H',I:'I',J:'ɾ',
    K:'ʞ',L:'˥',M:'W',N:'N',O:'O',P:'d',Q:'Q',R:'ɹ',S:'S',T:'┴',
    U:'∩',V:'Λ',W:'M',X:'X',Y:'⅄',Z:'Z',
    '1':'Ɩ','2':'ᄅ','3':'Ɛ','4':'ㄣ','5':'ϛ','6':'9','7':'Ɫ','8':'8','9':'6','0':'0',
    '.':'˙',',':'\'','\'':',','!':'¡','?':'¿','(':')',')':'(',
    '[':']',']':'[','{':'}','}':'{',' ':' '
  };
  return [...text].reverse().map(c => map[c] !== undefined ? map[c] : c).join('');
}

// 4. Cyber ｓｉｌａｎａ (fullwidth)
function cyber(text) {
  return [...text].map(c => {
    const code = c.charCodeAt(0);
    if (code >= 33 && code <= 126) return String.fromCharCode(code + 0xFEE0);
    if (c === ' ') return '　';
    return c;
  }).join('');
}

// 5. Mystic s҉i҉l҉a҉n҉a҉ (Slavic combining char)
function mystic(text) {
  return [...text].map(c => c === ' ' ? ' ' : c + '҉').join('');
}

// ── Bonus styles (إضافيات) ───────────────────────────────────────────────

// Bold Serif 𝐬𝐢𝐥𝐚𝐧𝐚
function boldSerif(text) {
  return [...text].map(c => {
    const l = c.charCodeAt(0);
    if (l >= 97 && l <= 122) return String.fromCodePoint(0x1D41E + (l - 97));
    if (l >= 65 && l <= 90)  return String.fromCodePoint(0x1D400 + (l - 65));
    if (l >= 48 && l <= 57)  return String.fromCodePoint(0x1D7CE + (l - 48));
    return c;
  }).join('');
}

// Script 𝓈𝒾𝓁𝒶𝓃𝒶
function scriptStyle(text) {
  return [...text].map(c => {
    const l = c.charCodeAt(0);
    if (l >= 97 && l <= 122) return String.fromCodePoint(0x1D4B6 + (l - 97));
    if (l >= 65 && l <= 90)  return String.fromCodePoint(0x1D49C + (l - 65));
    return c;
  }).join('');
}

// Strikethrough s̶i̶l̶a̶n̶a̶
function strikethrough(text) {
  return [...text].map(c => c === ' ' ? ' ' : c + '\u0336').join('');
}

// Bubble / Circled ⓢⓘⓛⓐⓝⓐ
function bubble(text) {
  return [...text.toLowerCase()].map(c => {
    const code = c.charCodeAt(0);
    if (code >= 97 && code <= 122) return String.fromCodePoint(0x24D0 + (code - 97));
    if (code >= 48 && code <= 57)  return code === 48 ? '⓪' : String.fromCodePoint(0x2460 + (code - 49));
    return c;
  }).join('');
}

// Vaporwave / Aesthetic ｓｉｌａｎａ already covered by cyber
// Old English 𝔰𝔦𝔩𝔞𝔫𝔞
function oldEnglish(text) {
  return [...text].map(c => {
    const l = c.charCodeAt(0);
    if (l >= 97 && l <= 122) return String.fromCodePoint(0x1D530 + (l - 97));
    if (l >= 65 && l <= 90)  return String.fromCodePoint(0x1D504 + (l - 65));
    return c;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════════════════
//  ALL STYLES REGISTRY
// ═══════════════════════════════════════════════════════════════════════════
const STYLES = [
  { name: 'Negative Squared', emoji: '🔲', fn: negativeSquared },
  { name: 'Small Caps',       emoji: '🔡', fn: smallCaps       },
  { name: 'Mirror',           emoji: '🪞', fn: mirror          },
  { name: 'Cyber',            emoji: '🤖', fn: cyber           },
  { name: 'Mystic',           emoji: '🔮', fn: mystic          },
  { name: 'Bold',             emoji: '💪', fn: boldSerif       },
  { name: 'Script',           emoji: '✒️',  fn: scriptStyle     },
  { name: 'Strikethrough',    emoji: '❌', fn: strikethrough   },
  { name: 'Bubble',           emoji: '🔵', fn: bubble          },
  { name: 'Old English',      emoji: '📜', fn: oldEnglish      },
];

// ═══════════════════════════════════════════════════════════════════════════
//  HANDLER
// ═══════════════════════════════════════════════════════════════════════════
let handler = async (m, { text }) => {
  const input = String(text || '').trim();

  if (!input) {
    return m.reply(
`❌ *كتب النص اللي بغيت تحولو!*
*Type the text you want to style!*

📌 *مثال / Example:*
\`.texttrick silana\`
\`.tt hello world\`
\`.fancy your name\``
    );
  }

  if (input.length > 50) {
    return m.reply(`❌ النص طويل بزاف — max 50 حرف.\nText too long — max 50 chars.`);
  }

  // Build message with all styles
  let msg = `✨ *TextTrick — "${input}"*\n`;
  msg += `${'━'.repeat(28)}\n\n`;

  for (const style of STYLES) {
    let converted;
    try {
      converted = style.fn(input);
    } catch {
      converted = input;
    }
    msg += `${style.emoji} *${style.name}*\n`;
    msg += `${converted}\n\n`;
  }

  msg += `${'━'.repeat(28)}\n`;
  msg += `⚡ Zero dependencies — Pure Unicode`;

  return m.reply(msg);
};

handler.help    = ['texttrick'];
handler.tags    = ['tools'];
handler.command = ['texttrick'];

export default handler;
