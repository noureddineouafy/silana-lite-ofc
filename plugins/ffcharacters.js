import axios from "axios";
import cheerio from "cheerio";

const BASE_URL = "https://freefire.fandom.com";
const LIST_URL = BASE_URL + "/wiki/Characters";

// Simple in-memory cache
let cache = {
  characters: null,
  timestamp: 0
};

const CACHE_DURATION = 1000 * 60 * 10; // 10 minutes

async function getCharacterList() {
  // Use cache if not expired
  if (cache.characters && (Date.now() - cache.timestamp < CACHE_DURATION)) {
    return cache.characters;
  }

  const { data: html } = await axios.get(LIST_URL);
  const $ = cheerio.load(html);

  let result = [];

  $("tr").each((i, el) => {
    const tds = $(el).find("td");
    if (tds.length >= 2) {
      const nameTd = $(tds[0]);
      const imageTd = $(tds[1]);

      const anchor = nameTd.find("a");
      const name = anchor.text().trim();
      const href = anchor.attr("href");

      if (!name || !href) return;

      const wikiLink = BASE_URL + href;

      const img = imageTd.find("img");
      const image = img.attr("data-src") || img.attr("src");

      result.push({
        name,
        wiki: wikiLink,
        image
      });
    }
  });

  cache.characters = result;
  cache.timestamp = Date.now();

  return result;
}

async function getCharacterDetail(url) {
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);

  const description = $(".mw-parser-output > p").first().text().trim();
  const img = $(".infobox img").first().attr("src");

  return {
    description: description || "No description available.",
    image: img || null
  };
}

let handler = async (m, { conn, args }) => {
  try {
    const characters = await getCharacterList();

    if (!args[0]) {
      // Default list (page 1)
      const perPage = 10;
      const page = 1;
      const start = (page - 1) * perPage;
      const end = start + perPage;

      const pageData = characters.slice(start, end);

      let text = `🔥 *Free Fire Characters*\n`;
      text += `Page ${page}\n\n`;

      pageData.forEach((c, i) => {
        text += `${start + i + 1}. ${c.name}\n`;
      });

      text += `\nUse: .ffcharacters 2 (for next page)\n`;
      text += `Use: .ffcharacters <name> (for details)`;

      return conn.reply(m.chat, text, m);
    }

    // If argument is a number -> pagination
    if (!isNaN(args[0])) {
      const perPage = 10;
      const page = parseInt(args[0]);
      const totalPages = Math.ceil(characters.length / perPage);

      if (page < 1 || page > totalPages) {
        return conn.reply(m.chat, `❌ Page must be between 1 and ${totalPages}`, m);
      }

      const start = (page - 1) * perPage;
      const end = start + perPage;
      const pageData = characters.slice(start, end);

      let text = `🔥 *Free Fire Characters*\n`;
      text += `Page ${page}/${totalPages}\n\n`;

      pageData.forEach((c, i) => {
        text += `${start + i + 1}. ${c.name}\n`;
      });

      return conn.reply(m.chat, text, m);
    }

    // Otherwise -> search by name
    const query = args.join(" ").toLowerCase();

    const found = characters.find(c =>
      c.name.toLowerCase().includes(query)
    );

    if (!found) {
      return conn.reply(m.chat, "❌ Character not found.", m);
    }

    const detail = await getCharacterDetail(found.wiki);

    let caption = `🔥 *${found.name}*\n\n`;
    caption += `📖 ${detail.description}\n\n`;
    caption += `🔗 ${found.wiki}`;

    if (detail.image) {
      await conn.sendFile(m.chat, detail.image, "character.jpg", caption, m);
    } else {
      await conn.reply(m.chat, caption, m);
    }

  } catch (err) {
    console.error(err);
    conn.reply(m.chat, "❌ Error fetching Free Fire data.", m);
  }
};

handler.help = ["ffcharacters"];
handler.command = ["ffcharacters"];
handler.tags = ["tools"];
handler.limit = true;

export default handler;
