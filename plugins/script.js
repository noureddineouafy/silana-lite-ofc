// instagram.com/noureddine_ouafy
/**
 * Plugin: .sc
 * Description: إرسال روابط السورس كود والقناة الرسمية
 */

let handler = async (m, { conn }) => {
  const teks = `📦 *رابط السورس كود الخاص بالبوت:*\n` +
    `https://github.com/noureddineouafy/silana-lite-ofc\n\n` +
    `📢 *القناة الرسمية على واتساب:*\n` +
    `https://whatsapp.com/channel/0029VaX4b6J7DAWqt3Hhu01A\n\n` +
    `⭐ لا تنسَ وضع نجمة على المستودع إذا أعجبك المشروع!`;

  await conn.reply(m.chat, teks, m);
};

handler.help = handler.command = ['sc','script'];
handler.tags = ['tools'];
handler.limit = true;
export default handler;
