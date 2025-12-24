import axios from 'axios';
import cheerio from 'cheerio';

let handler = async (m, { conn }) => {
  const query = m.text.split(' ').slice(1).join(' ') || 'termux'; 
  const apps = await avzxxx(query);

  if (apps.length > 0) {
    let message = 'Found the following apps:\n\n';
    apps.forEach((app, index) => {
      message += `**${index + 1}. ${app.title}**\nLink: ${app.apkUrl}\nImage: ${app.LinkGambar}\n\n`;
    });
    await conn.sendMessage(m.chat, { text: message }, { quoted: m });
  } else {
    await conn.sendMessage(m.chat, { text: 'No apps found for your query.' }, { quoted: m });
  }
};

handler.help = handler.command = ['f-droid'];
handler.tags = ['search'];

export default handler;

async function avzxxx(query) {
  const url = `https://search.f-droid.org/?q=${encodeURIComponent(query)}&lang=en`;

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const apps = [];
    $('.package-header').each((index, element) => {
      const title = $(element).find('.package-name').text().trim();
      const apkUrl = $(element).attr('href');
      const LinkGambar = $(element).find('.package-icon').attr('src');
      apps.push({ title, apkUrl, LinkGambar });
    });
    return apps;
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}
