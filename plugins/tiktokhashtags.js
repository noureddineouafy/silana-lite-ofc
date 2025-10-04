// instagram.com/noureddine_ouafy
// scrape by GilangSan
import axios from "axios";
import cheerio from "cheerio";

async function getHashtagCount(hashtag) {
  if (!hashtag) throw new Error("Hashtag not provided");

  try {
    const { data } = await axios.get(
      `https://tiktokhashtags.com/hashtag/${encodeURIComponent(hashtag)}`
    );

    const $ = cheerio.load(data);
    const trendingSec = $("#tranding");

    const posts = $(".shortcode-html")
      .find(".col-lg-4")
      .eq(0)
      .find(".g-font-size-26")
      .text()
      .trim();

    const views = $(".shortcode-html")
      .find(".col-lg-4")
      .eq(1)
      .find(".g-font-size-26")
      .text()
      .trim();

    const viewsPerPost = $(".shortcode-html")
      .find(".col-lg-4")
      .eq(2)
      .find(".g-font-size-26")
      .text()
      .trim();

    const mostPopular = $("p1").text().trim();

    const trending = [];
    trendingSec.find("table tbody tr").each((i, el) => {
      trending.push({
        hashtag: $(el).find("td").eq(1).text().trim().replace("#", ""),
        posts: $(el).find("td").eq(2).text().trim(),
        views: $(el).find("td").eq(3).text().trim(),
        postsPerView: $(el).find("td").eq(4).text().trim(),
      });
    });

    return { posts, views, viewsPerPost, mostPopular, trending };
  } catch (e) {
    console.error("Error fetching hashtag data:", e.message);
    throw e;
  }
}

let handler = async (m, { text }) => {
  if (!text) return m.reply("Please enter a hashtag name (without #).");

  await m.reply("المرجو الانتظار قليلا لا تنسى ان تتابع \ninstagram.com/noureddine_ouafy");

  try {
    const result = await getHashtagCount(text);

    let message = `📊 *TikTok Hashtag Analytics*  
🔖 Hashtag: #${text}
📸 Posts: ${result.posts}
👁️ Views: ${result.views}
📈 Views per Post: ${result.viewsPerPost}
🔥 Most Popular Related: ${result.mostPopular || "N/A"}

📌 *Trending Hashtags:*
`;

    if (result.trending.length > 0) {
      for (let i = 0; i < Math.min(result.trending.length, 5); i++) {
        const tag = result.trending[i];
        message += `\n#${tag.hashtag} — ${tag.views} views (${tag.posts})`;
      }
    } else {
      message += "No trending data found.";
    }

    await m.reply(message);
  } catch (e) {
    await m.reply("❌ Error: Failed to fetch hashtag data.");
  }
};

handler.help = handler.command = ["tiktokhashtags"];
handler.tags = ["tools"];
handler.limit = true;

export default handler;
