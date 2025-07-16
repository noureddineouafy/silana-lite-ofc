//plugin by noureddine Ouafy 
// scrape by wolfyflutter
import fetch from 'node-fetch';

const yt = {
  headers: {
    accept: "*/*",
    "accept-encoding": "gzip, deflate, br, zstd",
    "accept-language": "en-GB,en;q=0.9,en-US;q=0.8",
    "cache-control": "no-cache",
    pragma: "no-cache",
    priority: "u=1, i",
    "sec-ch-ua": '"Not)A;Brand";v="8", "Chromium";v="138", "Microsoft Edge";v="138"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0",
  },

  mintaJson: async (desc, url, opts) => {
    try {
      const response = await fetch(url, opts);
      if (!response.ok)
        throw new Error(`${response.status} ${response.statusText}\n${(await response.text()) || ""}`);
      return await response.json();
    } catch (err) {
      throw new Error(`Fetch failed: ${desc}\nReason: ${err.message}`);
    }
  },

  search: async (query) => {
    if (typeof query !== "string" || !query.length) throw new Error(`Invalid or empty query`);
    const headers = {
      ...yt.headers,
      origin: "https://v2.www-y2mate.com",
      referer: "https://v2.www-y2mate.com/",
    };
    return await yt.mintaJson(
      "search",
      `https://wwd.mp3juice.blog/search.php?q=${encodeURIComponent(query)}`,
      { headers }
    );
  },

  getKey: async () => {
    const headers = {
      "content-type": "application/json",
      origin: "https://iframe.y2meta-uk.com",
      referer: "https://iframe.y2meta-uk.com/",
      ...yt.headers,
    };
    return await yt.mintaJson("getting key", "https://api.mp3youtube.cc/v2/sanity/key", { headers });
  },

  handleFormat: (link, formatId) => {
    const listFormat = ["128kbps", "320kbps", "144p", "240p", "360p", "720p", "1080p"];
    if (typeof link !== "string" || !link.length) throw new Error(`Invalid or empty link`);
    if (typeof formatId !== "string" || !formatId.length) throw new Error(`Invalid or empty format id`);
    if (!listFormat.includes(formatId))
      throw new Error(`${formatId} is invalid format id. Available: ${listFormat.join(", ")}`);

    const match = formatId.match(/(\d+)(\w+)/);
    const format = match[2] === "kbps" ? "mp3" : "mp4";
    const audioBitrate = format === "mp3" ? match[1] : 128;
    const videoQuality = format === "mp4" ? match[1] : 720;
    const filenameStyle = "pretty";
    const vCodec = "h264";
    return { link, format, audioBitrate, videoQuality, filenameStyle, vCodec };
  },

  convert: async (youtubeUrl, formatId = "128kbps") => {
    const { key } = await yt.getKey();

    const headers = {
      "content-type": "application/x-www-form-urlencoded",
      Key: key,
      origin: "https://iframe.y2meta-uk.com",
      referer: "https://iframe.y2meta-uk.com/",
      ...yt.headers,
    };

    const payload = yt.handleFormat(youtubeUrl, formatId);
    const body = new URLSearchParams(payload);

    const json = await yt.mintaJson("convert", "https://api.mp3youtube.cc/v2/converter", {
      headers,
      body,
      method: "POST",
    });
    json.chosenFormat = formatId;
    return json;
  },

  searchAndDownload: async (query, formatId = "128kbps") => {
    const searchResult = await yt.search(query);
    if (!searchResult?.items?.length) throw new Error("No search results found");
    const youtubeUrl = `https://youtu.be/${searchResult.items[0].id}`;
    return await yt.convert(youtubeUrl, formatId);
  },
};

let handler = async (m, { conn, text }) => {
  try {
    if (!text) {
      return m.reply(`📥 *YouTube Downloader*

Usage:
.y2meta <query> — download audio (default 128kbps)
.y2meta <query>|<format>

Available formats:
• 128kbps, 320kbps (Audio)
• 144p, 240p, 360p, 720p, 1080p (Video)

Examples:
.y2meta safe and sound
.y2meta safe and sound|320kbps
.y2meta funny cat|720p`);
    }

    let [query, format] = text.split("|").map((v) => v.trim());
    if (!format) format = "128kbps";

    await m.reply(`🔍 Searching for: "${query}" with format: "${format}"\nPlease wait...`);

    const result = await yt.searchAndDownload(query, format);
    if (!result || !result.url) throw "No download URL found.";

    const response = await fetch(result.url);
    if (!response.ok) throw new Error("Failed to download media file");
    const arrayBuffer = await response.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);
    const isAudio = format.endsWith("kbps");
    const mimetype = isAudio ? "audio/mpeg" : "video/mp4";
    const mediaType = isAudio ? "audio" : "document"; // only video sent as document

    await conn.sendMessage(
      m.chat,
      {
        [mediaType]: buffer,
        mimetype,
        fileName: result.filename || `file.${isAudio ? "mp3" : "mp4"}`,
      },
      { quoted: m }
    );
  } catch (error) {
    await m.reply(`❌ Error: ${error.message || error}`);
  }
};

handler.help = ["y2meta"];
handler.tags = ["downloader"];
handler.command = ["y2meta"];
handler.limit = true;

export default handler;
