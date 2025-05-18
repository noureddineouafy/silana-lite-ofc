// INSTAGRAM: instagram.com/noureddine_ouafy
// TRANSLATE PLUGIN - DEFAULT TO ARABIC

import fetch from 'node-fetch';

const handler = async (m, { args, usedPrefix, command, conn }) => {
  let lang, text;

  if (args.length >= 2) {
    lang = args[0] || 'ar';
    text = args.slice(1).join(' ');
  } else if (m.quoted && m.quoted.text) {
    lang = args[0] || 'ar';
    text = m.quoted.text;
  } else {
    throw `مثال:\n${usedPrefix + command} ar Hello, how are you`;
  }

  try {
    const prompt = text.trim();
    const result = await translate(prompt, lang);
    const supportedLangs = Object.keys(await getLangList());

    if (!supportedLangs.includes(lang)) {
      const errorMsg = `❌ *خطأ:* اللغة "${lang}" غير مدعومة.\n\n*مثال:*\n.${command} ar Hello\n\n*اللغات المتوفرة:*\n` + 
        supportedLangs.map((v, i) => `${i + 1}. ${v}`).join('\n');
      return m.reply(errorMsg);
    }

    const translation = result[0].trim();
    const replyText = `*تفضل هذه ترجمتك:*\n\n${translation}`;
    await m.reply(replyText, null, m.mentionedJid ? { mentions: conn.parseMention(translation) } : {});
  } catch (e) {
    await m.reply("❌ حدث خطأ أثناء الترجمة.");
  }
};

handler.help = ['translate'];
handler.tags = ['tools'];
handler.command = /^translate|tr$/i;
handler.limit = true;
export default handler;

async function getLangList() {
  const res = await fetch('https://translate.google.com/translate_a/l?client=webapp&sl=auto&tl=en&v=1.0&hl=en&pv=1&tk=&source=bh&ssel=0&tsel=0&kc=1&tk=626515.626515&q=');
  const data = await res.json();
  return data.tl;
}

async function translate(query = '', lang) {
  if (!query.trim()) return '';

  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.append('client', 'gtx');
  url.searchParams.append('sl', 'auto');
  url.searchParams.append('tl', lang);
  url.searchParams.append('dt', 't');
  url.searchParams.append('q', query);

  try {
    const res = await fetch(url.href);
    const json = await res.json();
    if (json) {
      return [json[0].map(item => item[0].trim()).join('\n'), json[2]];
    } else {
      return '';
    }
  } catch (error) {
    throw error;
  }
}
