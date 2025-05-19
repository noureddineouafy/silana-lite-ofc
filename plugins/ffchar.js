/**
 * IG: instagram.com/noureddine_ouafy
 * CR Ponta Sensei
 * CH https://whatsapp.com/channel/0029Vb5WqvG8kyyUxQpaS80c
 * API https://pontafly.biz.id
 */

import { load } from 'cheerio';
import fetch from 'node-fetch';

let handler = async (m, { conn, args }) => {
  if (!args[0]) return m.reply('Please provide a character ID.\nExample: .ffchar 580');

  let charId = args[0];
  const url = `https://ff.garena.com/id/chars/${charId}`;
  const response = await fetch(url);
  const html = await response.text();
  const $ = load(html);

  const char = [
    `*Name:* ${$('.char-name').text().trim()}`,
    `*Abstract:* ${$('.char-abstract').text().trim()}`,
    `*Ability:* ${$('.skill-profile-name').text().trim()}`,
    `*Ability Description:* ${$('.skill-introduction').text().trim()}`,
    `*Biography:* ${$('.detail p').text().trim()}`,
    `*Profile:*`,
    ...$('.profile-item').map((i, el) =>
      `  *${$(el).find('.profile-key').text().trim()}*: ${$(el).find('.profile-value').text().trim()}`
    ).get(),
    `*Images:*`,
    `  *Character:* ${$('.char-pic img').attr('src')}`,
    `  *Background:* ${$('.char-detail-bg-pic div').first().css('background-image')?.match(/url"(.+)"/)?.[1] || 'Not available'}`,
    `  *Biography:* ${$('.pic-img').css('background-image')?.match(/url"(.+)"/)?.[1] || 'Not available'}`,
    `*Previous Character:*`,
    `  *Name:* ${$('.char-prev .pre-next .prev div').text().trim()}`,
    `  *Link:* ${$('.char-prev a').attr('href')}`,
    `*Next Character:*`,
    `  *Name:* ${$('.char-next .pre-next .next div').text().trim()}`,
    `  *Link:* ${$('.char-next a').attr('href')}`
  ].join('\n');

  await m.reply(char);
};

handler.help = ['ffchar'];
handler.tags = ['tools'];
handler.command = ['ffchar'];
handler.limit = true;
export default handler;
