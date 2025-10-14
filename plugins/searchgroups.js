// plugin by noureddine ouafy
// scrape by https://pastebin.com/bTbi66Zp
import axios from "axios";
import cheerio from "cheerio";

let handler = async (m, { conn, text }) => {
    try {
        if (!text) {
            // Show usage guide if no keywords provided
            let guide = `⚡ *WhatsApp Groups Search Guide*\n\n` +
                        `✏️ *Command:* .searchgroups <keywords>\n` +
                        `📌 You can enter one or more keywords separated by commas.\n\n` +
                        `Example:\n` +
                        `.searchgroups anime, games, movies\n\n` +
                        `💡 The bot will search for groups matching these keywords and display the name, description, and invite link.`;
            return await conn.sendMessage(m.chat, { text: guide }, { quoted: m });
        }

        const headers = {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Referer": "https://groupda1.link/add/group/search",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html, */*; q=0.01",
            "Host": "groupda1.link",
            "Origin": "https://groupda1.link",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        };

        const results = [];
        const keywordList = text.split(',');

        for (const name of keywordList) {
            const keyword = name.trim();
            let loop_count = 0;

            while (loop_count < 10) {
                const data = new URLSearchParams({
                    group_no: `${loop_count}`,
                    search: true,
                    keyword: keyword,
                    category: "Any Category",
                    country: "Indonesia",
                    language: "Any Language"
                });

                try {
                    const response = await axios.post(
                        "https://groupda1.link/add/group/loadresult",
                        data.toString(),
                        { headers, timeout: 10000 }
                    );

                    const textResp = response.data;
                    if (!textResp || textResp.length === 0) break;

                    const $ = cheerio.load(textResp);
                    let found = false;

                    for (const maindiv of $('.maindiv').toArray()) {
                        const tag = $(maindiv).find('a[href]');
                        if (!tag.length) continue;

                        const link = tag.attr('href');
                        const title = tag.attr('title').replace('Whatsapp group invite link: ', '');
                        const description_tag = $(maindiv).find('p.descri');
                        const description = description_tag.text().trim() || 'No description';
                        const group_id = link.split('/').pop();
                        const group_link = `https://chat.whatsapp.com/${group_id}`;

                        if (!results.some(g => g.Code === group_id)) {
                            results.push({
                                Name: title,
                                Code: group_id,
                                Link: group_link,
                                Description: description,
                                Keyword: keyword
                            });
                            found = true;
                        }
                    }

                    if (!found) break;
                    loop_count++;
                    await new Promise(resolve => setTimeout(resolve, 1000));

                } catch (error) {
                    console.error(`Error on page ${loop_count + 1}: ${error.message}`);
                    break;
                }
            }
        }

        if (results.length === 0) return m.reply("⚠️ No groups found for these keywords.");

        // Build the message to send
        let message = "*🔍 WhatsApp Groups Search Results:*\n\n";
        results.forEach((g, i) => {
            message += `*${i + 1}. ${g.Name}*\nDescription: ${g.Description}\n🔗 Link: ${g.Link}\nKeyword: ${g.Keyword}\n\n`;
        });

        await conn.sendMessage(m.chat, { text: message }, { quoted: m });

    } catch (err) {
        console.error(err);
        m.reply("❌ An error occurred while searching for groups.");
    }
};

handler.help = ["searchgroups"];
handler.tags = ["search"];
handler.command = ["searchgroups"];
handler.limit = true;

export default handler;
