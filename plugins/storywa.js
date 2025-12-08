// plugin by noureddine ouafy 
// scrape by malik
import axios from "axios";
import crypto from "crypto";

// ========== CLIENT CLASS ==========
class LulaStoryClient {
  constructor() {
    this.host = "https://storywav4.lulaservice.web.id";
    this.ua = "okhttp/3.12.0";
    this.pkg = "com.storywa.vidstatus.videostatus";
    this.devId = crypto.randomBytes(16).toString("hex");
  }

  makeUrl(file, type) {
    if (!file) return null;
    const base = "https://storywav4.lulaservice.web.id/status/NewUploads";
    const filename = file.split("/").pop();
    const encoded = encodeURIComponent(filename);

    switch (type) {
      case "video": return `${base}/mojly/${encoded}`;
      case "thumb": return `${base}/mojly/thumbs/${encoded}`;
      case "profile": return `${base}/profile/${encoded}`;
      default:
        if (file.startsWith("http://") || file.startsWith("https://")) return file;
        if (file.startsWith("//")) return `https:${file}`;
        if (file.includes(".")) return `https://${file}`;
        return file;
    }
  }

  async req(method, path, data = {}) {
    const isGet = method === "GET";
    const url = `${this.host}/${path}${isGet ? "?" + new URLSearchParams(data) : ""}`;

    const body = isGet ? undefined : { app: this.pkg, ...data };

    try {
      const { data: res } = await axios({
        method,
        url,
        data: body,
        headers: {
          "User-Agent": this.ua,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        timeout: 10000
      });

      return res?.msg || res || [];
    } catch (err) {
      console.error(`[ERR] ${method} ${path}: ${err.message}`);
      return [];
    }
  }

  async search({ query, page = 1 }) {
    return this.req("POST", "getdatacategorywise1.php", { search: query, page });
  }

  async by_cats({ cat, page = 1 }) {
    return this.req("POST", "getdatacategorywise1.php", { cat, page });
  }

  async cats() {
    return this.req("POST", "getallcategory.php", {});
  }

  async music() {
    return this.req("POST", "getAllMusicList.php", {});
  }

  async status({ page = 1, type = 0, lang = 0 } = {}) {
    const raw = await this.req("GET", "status/default.php", {
      page,
      "device-id": this.devId,
      type,
      lang
    });

    return Array.isArray(raw)
      ? raw.map(item => ({
          id: item?.id ?? "0",
          title: item?.video_url?.replace(".mp4", "") || "Untitled",
          category: item?.cat_name || "Unknown",
          video: this.makeUrl(item?.video_url, "video"),
          thumb: this.makeUrl(item?.thumb_image, "thumb"),
          stats: {
            downloads: Number(item?.downloads) || 0,
            likes: Number(item?.likes) || 0,
            shares: Number(item?.shares) || 0
          },
          uploaded: item?.uploaded_on || null
        }))
      : [];
  }

  async status_cats() {
    return this.req("GET", "status/default.php", { type: "category" });
  }

  async download({ id }) {
    const raw = await this.req("GET", "status/addDownloads.php", { id });

    if (Array.isArray(raw) && raw[0]) {
      const item = raw[0];
      return {
        id: item?.id,
        category: item?.cat_name,
        video: this.makeUrl(item?.video_url, "video"),
        thumb: this.makeUrl(item?.video_thumb, "thumb"),
        stats: {
          downloads: Number(item?.downloads) || 0,
          likes: Number(item?.likes) || 0,
          shares: Number(item?.shares) || 0
        },
        uploaded: item?.uploaded_on
      };
    }
    return null;
  }
}

// ========== WHATSAPP BOT HANDLER ==========

let handler = async (m, { conn, args }) => {
  const api = new LulaStoryClient();

  if (!args.length)
    return m.reply(guideText);

  const action = args[0].toLowerCase();
  const input = args.slice(1).join(" ");

  let result;

  switch (action) {
    case "search":
      if (!input) return m.reply("❗ Please provide a search keyword.");
      result = await api.search({ query: input });
      break;

    case "bycat":
      if (!input) return m.reply("❗ Please provide a category name.");
      result = await api.by_cats({ cat: input });
      break;

    case "cats":
      result = await api.cats();
      break;

    case "music":
      result = await api.music();
      break;

    case "status":
      result = await api.status({});
      break;

    case "statuscats":
      result = await api.status_cats();
      break;

    case "download":
      if (!input) return m.reply("❗ Please provide a video ID to download.");
      result = await api.download({ id: input });
      break;

    default:
      return m.reply(`❌ Unknown action.\n\n${guideText}`);
  }

  m.reply(JSON.stringify(result, null, 2));
};

// ========== GUIDE TEXT IN ENGLISH ==========
const guideText = `
📘 *Lula Story WA Downloader*
This feature lets you search, view categories, get status videos, music lists, and download StoryWA videos.

🧩 *How To Use:*

🔍 *Search videos*
> .storywa search love

📂 *List categories*
> .storywa cats

📁 *Get videos by category*
> .storywa bycat Romantic

🎵 *Get all music list*
> .storywa music

🎞 *List status videos*
> .storywa status

🏷 *List status categories*
> .storywa statuscats

⬇️ *Download video by ID*
> .storywa download 192828

Use English keywords for better accuracy.
`;

handler.help = handler.command = ['storywa'];
handler.tags = ['search'];
handler.limit = true;

export default handler;
