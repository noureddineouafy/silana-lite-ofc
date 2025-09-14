import axios from "axios";
import FormData from "form-data";

// The GhibliAPI class encapsulates all the logic for interacting with the API.
class GhibliAPI {
  constructor() {
    this.api = {
      base: "https://api.code12.cloud",
      endpoints: {
        paygate: slug => `/app/paygate-oauth${slug}`,
        ghibli: slug => `/app/v2/ghibli/user-image${slug}`
      }
    };
    this.creds = {
      appId: "DKTECH_GHIBLI_Dktechinc",
      secretKey: "r0R5EKF4seRwqUIB8gLPdFvNmPm8rN63"
    };
    // A list of available Ghibli art styles.
    this.studios = ["ghibli-howl-moving-castle-anime", "ghibli-spirited-away-anime", "ghibli-my-neighbor-totoro-anime", "ghibli-ponyo-anime", "ghibli-grave-of-fireflies-anime", "ghibli-princess-mononoke-anime", "ghibli-kaguya-anime"];
    this.headers = {
      "user-agent": "NB Android/1.0.0",
      "accept-encoding": "gzip"
    };
    this.db = {
      token: null,
      tokenExpire: null,
      encryptionKey: null
    };
  }

  // A simple logger for debugging.
  log(message, level = "info") {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    if (level === "error") {
      console.error(logMessage);
    } else {
      console.log(logMessage);
    }
  }

  // In-memory storage for the API token.
  readDB() {
    return this.db;
  }

  writeDB(data) {
    this.db = { ...this.db, ...data };
    return true;
  }

  // Validates and returns the full studio ID string.
  getStudioId(id) {
    if (typeof id === "number" && this.studios[id]) {
      return this.studios[id];
    }
    if (typeof id === "string" && this.studios.includes(id)) {
      return id;
    }
    return null;
  }

  // Fetches a new API token when required.
  async getNewToken() {
    try {
      const url = `${this.api.base}${this.api.endpoints.paygate("/token")}`;
      const res = await axios.post(url, {
        appId: this.creds.appId,
        secretKey: this.creds.secretKey
      }, {
        headers: {
          ...this.headers,
          "content-type": "application/json"
        }
      });
      if (res.status !== 200 || res.data?.status?.code !== "200") {
        const errorMessage = res.data?.status?.message || "Failed to retrieve token";
        return { success: false, result: { error: errorMessage } };
      }
      const { token, tokenExpire, encryptionKey } = res.data.data;
      this.writeDB({ token, tokenExpire, encryptionKey });
      return { success: true, result: { token, tokenExpire, encryptionKey } };
    } catch (error) {
      return { success: false, result: { error: error.message } };
    }
  }

  // Gets a valid token, either from storage or by fetching a new one.
  async getToken() {
    const db = this.readDB();
    if (db && db.token && Date.now() < db.tokenExpire) {
      return { success: true, result: db };
    }
    return await this.getNewToken();
  }

  // The main method to generate the Ghibli-styled image.
  async generate({ imageFile, studio }) {
    try {
      if (!imageFile) {
        return { success: false, code: 400, result: { error: "Image file is required" } };
      }
      const studioId = this.getStudioId(studio);
      if (!studioId) {
        return {
          success: false,
          code: 400,
          result: { error: `Studio must be an index (0-${this.studios.length - 1})` }
        };
      }
      const tokenResult = await this.getToken();
      if (!tokenResult.success) {
        return tokenResult;
      }
      const { token } = tokenResult.result;
      const form = new FormData();
      form.append("studio", studioId);
      form.append("file", imageFile, { filename: "image.jpg", contentType: "image/jpeg" });
      const url = `${this.api.base}${this.api.endpoints.ghibli("/edit-theme")}?uuid=1212`;
      const res = await axios.post(url, form, {
        headers: { ...form.getHeaders(), ...this.headers, authorization: `Bearer ${token}` },
        timeout: 60000 // 60 seconds timeout
      });
      if (res.status !== 200 || res.data?.status?.code !== "200") {
        const errorMessage = res.data?.status?.message || `HTTP ${res.status}`;
        return { success: false, code: res.status, result: { error: errorMessage } };
      }
      const { imageUrl } = res.data.data;
      return { success: true, code: 200, result: { imageUrl } };
    } catch (error) {
      this.log(`Generation error: ${error.message}`, "error");
      return { success: false, code: 500, result: { error: error.message } };
    }
  }
}

// This is the main handler function for the bot command.
let handler = async (m, { conn, text, usedPrefix, command }) => {
  const ghibli = new GhibliAPI(); // Instantiate the API client

  // Create a user-friendly list of available styles.
  const studioList = ghibli.studios
    .map((id, i) => `*[${i}]* ${id.replace(/ghibli|-|anime/g, ' ').trim().replace(/\b\w/g, l => l.toUpperCase())}`)
    .join("\n");
    
  let q = m.quoted ? m.quoted : m;
  let mime = (q.msg || q).mimetype || q.mediaType || "";

  // Check if the user replied to an image.
  if (!/image/g.test(mime)) {
    return m.reply(`Please reply to an image with a style number. 🖼️\n\n*Example:*\n${usedPrefix + command} 2\n\n*Available Styles:*\n${studioList}`);
  }

  // Parse the style number from the user's message.
  let [studio] = text.split(" ");
  if (!studio || isNaN(studio)) {
    return m.reply(`You forgot the style number! 🤔\n\n*Example:*\n${usedPrefix + command} 2\n\n*Available Styles:*\n${studioList}`);
  }

  await m.reply("Processing your image, please wait... 🎨");

  try {
    const imgBuffer = await q.download(); // Download the image buffer
    const result = await ghibli.generate({
      imageFile: imgBuffer,
      studio: parseInt(studio, 10) // Convert style to a number
    });

    // Handle the API response.
    if (result.success) {
      await conn.sendFile(m.chat, result.result.imageUrl, 'ghibli.jpg', `Here is your Ghibli-styled image!\n*Style:* ${ghibli.getStudioId(parseInt(studio,10)).replace(/ghibli|-|anime/g, ' ').trim()}`, m);
    } else {
      // Provide a specific error message if the style number is invalid.
      let errorMessage = `An error occurred: ${result.result.error}`;
      if (result.code === 400 && result.result.error.includes("Studio must be an index")) {
        errorMessage = `Invalid style number. Please use a number from 0 to ${ghibli.studios.length - 1}.\n\n*Available Styles:*\n${studioList}`;
      }
      await m.reply(errorMessage);
    }
  } catch (e) {
    console.error(e);
    await m.reply("An unexpected error occurred. Please try again later. 😥");
  }
};

// Define command properties for the bot.
handler.help = ['ghiblistudio'];
handler.command = ['ghiblistudio'];
handler.tags = ['ai'];
handler.limit = true; // This likely enables a usage limit/cooldown system.

export default handler;
