import axios from 'axios';

class WebToNativeClient {
  constructor() {
    this.baseURL = "https://www.webtonative.com/api/v1";
    this.defaultHeaders = {
      "accept-language": "ms-MY",
      origin: "https://www.webtonative.com",
      priority: "u=1, i",
      referer: "https://www.webtonative.com/",
      "sec-ch-ua": `"Chromium";v="127", "Not)A;Brand";v="99", "Microsoft Edge Simulate";v="127", "Lemur";v="127"`,
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": `"Android"`,
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
    };
  }

  async buildApp({ appName, websiteUrl }) {
    const res = await axios.post(
      `${this.baseURL}/build-app-request`,
      {
        appName,
        emailId: "Gk perlu email, itu aja bisa 🗿",
        packageId: "WEBTONATIVE_STARTER",
        websiteUrl,
        referralCode: "",
        utmInfo: { utm_source: "", utm_medium: "", utm_campaign: "", utm_term: "", utm_content: "" },
        device_type: "website",
        browser: "chrome",
      },
      { headers: this.defaultHeaders }
    );
    if (!res.data?.isSuccess) throw new Error("Build app request failed");
    return res.data;
  }

  async checkStatus(requestId) {
    const res = await axios.get(`${this.baseURL}/check-app-status`, {
      params: { requestId },
      headers: this.defaultHeaders,
    });
    return res.data;
  }

  async waitUntilDone(requestId, interval = 5000, maxWait = 300000) {
    const start = Date.now();
    while (true) {
      if (Date.now() - start > maxWait) throw new Error("Timeout: APK build took too long.");
      const data = await this.checkStatus(requestId);
      if (data.android_status === "DONE" && data.ios_status === "DONE") {
        return {
          ...data,
          android_url: `${this.baseURL}/demo/download/${requestId}/ANDROID`,
          ios_url: `${this.baseURL}/demo/download/${requestId}/IOS`,
        };
      }
      await new Promise((r) => setTimeout(r, interval));
    }
  }

  async buildAndWait(payload, interval = 5000) {
    const build = await this.buildApp(payload);
    return await this.waitUntilDone(build.requestId, interval);
  }
}

let handler = async (m, { conn, args, text, usedPrefix, command }) => {

  // Show guide if no args
  if (!text) {
    return conn.sendMessage(m.chat, {
      text: `📱 *Website to APK Converter*\n\n` +
        `Convert any website into an Android APK and iOS app — for free!\n\n` +
        `*How to use:*\n` +
        `${usedPrefix}${command} <App Name> | <Website URL>\n\n` +
        `*Examples:*\n` +
        `• ${usedPrefix}${command} My Store | https://mystore.com\n` +
        `• ${usedPrefix}${command} Silana Bot | https://silanabot.com\n\n` +
        `*What you'll get:*\n` +
        `✅ Android APK download link\n` +
        `✅ iOS app download link\n\n` +
        `⚠️ *Notes:*\n` +
        `• The website must be publicly accessible\n` +
        `• Build may take 1–5 minutes, please be patient\n` +
        `• Use *|* to separate app name and URL`
    }, { quoted: m });
  }

  // Parse "App Name | https://url.com"
  const parts = text.split('|').map(p => p.trim());
  if (parts.length < 2 || !parts[1].startsWith('http')) {
    return conn.sendMessage(m.chat, {
      text: `❌ Invalid format!\n\n` +
        `*Correct usage:*\n` +
        `${usedPrefix}${command} <App Name> | <Website URL>\n\n` +
        `*Example:*\n` +
        `${usedPrefix}${command} Silana | https://silanabot.com`
    }, { quoted: m });
  }

  const appName = parts[0];
  const websiteUrl = parts[1];

  await conn.sendMessage(m.chat, {
    text: `⚙️ *Building your app...*\n\n` +
      `📛 App Name: *${appName}*\n` +
      `🌐 URL: ${websiteUrl}\n\n` +
      `⏳ This may take 1–5 minutes. Please wait...`
  }, { quoted: m });

  try {
    const client = new WebToNativeClient();
    const result = await client.buildAndWait({ appName, websiteUrl });

    await conn.sendMessage(m.chat, {
      text: `✅ *App Build Complete!*\n\n` +
        `📛 App Name: *${appName}*\n` +
        `🌐 Website: ${websiteUrl}\n\n` +
        `📥 *Download Links:*\n` +
        `🤖 Android APK: ${result.android_url}\n` +
        `🍎 iOS App: ${result.ios_url}`
    }, { quoted: m });

  } catch (err) {
    await conn.sendMessage(m.chat, {
      text: `❌ *Build Failed!*\n\nError: ${err.message}\n\n` +
        `Please make sure:\n` +
        `• The URL is valid and publicly accessible\n` +
        `• The app name doesn't contain special characters`
    }, { quoted: m });
  }
};

handler.help = handler.command = [ 'apkmaker'];
handler.tags = ['tools'];
handler.limit = true;
export default handler;
