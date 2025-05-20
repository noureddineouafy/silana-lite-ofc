/**
 * ┌─「 Tixo Bot 」
 * ├ Creator: Tio × Tixo MD
 * ├ Platform: WhatsApp Bot
 * ├ Support us with a donation!
 * └─ 
 */
import * as cheerio from 'cheerio'
import fetch from 'node-fetch'

let handler = async (m, {
    conn,
    usedPrefix,
    command,
    text
}) => {
    if (!text) return m.reply(`Example:\n${usedPrefix + command} https://s.snackvideo.com/p/j9jKr9dR`)
    await m.react('🕐')
    try {
        let res = await snack(text)
        let capt = `username : ${res.author}\nlike : ${res.like}\ncomment : ${res.comment}\nshare : ${res.share}`
        await conn.sendFile(m.chat, res.media, '', capt, m)
    } catch (e) {
        console.log(e);
        m.reply('failed');
    }
}
handler.help = handler.command = ['snackvideo']
handler.limit = true;
handler.tags = ['downloader'];
export default handler;

async function snack(url) {
    return new Promise(async (resolve, reject) => {
        try {
            const res = await fetch(url).then((v) => v.text());
            const $ = cheerio.load(res);
            const video = $("div.video-box").find("a-video-player");
            const author = $("div.author-info");
            const attr = $("div.action");
            const data = {
                title: $(author)
                    .find("div.author-desc > span")
                    .children("span")
                    .eq(0)
                    .text()
                    .trim(),
                thumbnail: $(video)
                    .parent()
                    .siblings("div.background-mask")
                    .children("img")
                    .attr("src"),
                media: $(video).attr("src"),
                author: $("div.author-name").text().trim(),
                authorImage: $(attr).find("div.avatar > img").attr("src"),
                like: $(attr).find("div.common").eq(0).text().trim(),
                comment: $(attr).find("div.common").eq(1).text().trim(),
                share: $(attr).find("div.common").eq(2).text().trim(),
            };
            resolve(data);
        } catch (e) {
            reject(e);
        }
    });
}
