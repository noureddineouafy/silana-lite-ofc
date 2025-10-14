// plugin by noureddine ouafy
// scrape by Fahmi-XD
// instagram.com/noureddine_ouafy

import axios from "axios";
import crypto from "crypto";

class Util {
  static PRIMARY_KEY = "73587A446B5642716E6A6A48325742733561436D5A457847555273367A4E4B79";
  static X_TOKEN_KEY = "UAXFoplp5H87RRX7/HvrKAvO6rkH3IE/u0931xcvThO7sxOvv1cvz7H14iRSSHXM";
  static X_TOKEN_DEC = "OFx0xDz4WXeHQn+5mZtaf7eScT6WbgYRHV/cVLKIoYYbfpL0JYRPMY7G75BJQ5n2";
  static X_APP_KEY = "FJ7lkHHe8QSX1S5rCNkYlI9eBZTYLP1s2GgJFC5ZJhG6LWX37b5p7fyiZZN07uYR";
  static X_APP_DEC = "wy9V4gkza+fPVHVADo1nC8ln5otwFWqJ8xpElEXcS38=";

  static decrypt(strToDecrypt, secret) {
    const key = Buffer.from(secret, "utf-8");
    const iv = Buffer.from(secret.substring(0, 16), "utf-8");
    const encryptedText = Buffer.from(strToDecrypt, "base64");
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedText, null, "utf8");
    decrypted += decipher.final("utf8");
    return decrypted.replace(/\n/g, "");
  }

  static encrypt(strToEncrypt, secret) {
    const key = Buffer.from(secret, "utf-8");
    const iv = Buffer.from(secret.substring(0, 16), "utf-8");
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(strToEncrypt, "utf8", "base64");
    encrypted += cipher.final("base64");
    return encrypted.replace(/\n/g, "");
  }

  static hexToBytes(hexString) {
    if (!/^[0-9a-fA-F]+$/.test(hexString))
      throw new Error("Invalid hex string");
    return Buffer.from(hexString, "hex");
  }

  static getUtcTime() {
    return Math.floor(new Date().getTime() / 1000);
  }
}

async function fetchUrlData(targetUrl, options = {}) {
  if (!targetUrl || typeof targetUrl !== "string")
    throw new Error("❌ Please provide a valid link.");

  const { cookie = "" } = options;
  const data = new URLSearchParams();
  data.append("url", targetUrl);
  data.append("cookie", cookie);

  const key = Util.hexToBytes(Util.PRIMARY_KEY).toString();
  const unixTime = Util.getUtcTime();
  const xtokenKey = Util.decrypt(Util.X_TOKEN_KEY, key);
  const xtokenDec = Util.decrypt(Util.X_TOKEN_DEC, key);
  const xtoken = Util.encrypt(`${xtokenDec}___${unixTime}`, xtokenKey);
  const xappkeyKey = Util.decrypt(Util.X_APP_KEY, key);
  const xappkeyDec = Util.decrypt(Util.X_APP_DEC, key);
  const xappkey = Util.encrypt(`${xappkeyDec}___${unixTime}`, xappkeyKey);

  const config = {
    method: "POST",
    url: "https://downloaderapi.densavedownloader.app/index.php?action=extract",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36",
      referer: "https://downloaderapi.quqqashop.com/",
      "x-token": xtoken,
      "x-appkey": xappkey,
      "x-appcode": "haticitwitter",
      "content-type": "application/x-www-form-urlencoded",
    },
    data,
    timeout: 30000,
  };

  const response = await axios.request(config);
  return response.data;
}

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply("🔗 Please provide a valid Twitter/X link.");

  m.reply("⏳ Please wait... downloading the video.");

  try {
    const result = await fetchUrlData(text);
    if (result?.formats?.length) {
      const video = result.formats[result.formats.length - 1].url;
      const caption = `🎬 *${result.title || "Twitter Video"}*\n\n${result.description || ""}`;
      await conn.sendMessage(m.chat, { video: { url: video }, caption }, { quoted: m });
    } else {
      m.reply("⚠️ Failed to extract video link. Try another URL.");
    }
  } catch (err) {
    m.reply(`❌ Error: ${err.message}`);
  }
};

handler.help = handler.command = ["twitter-x"];
handler.tags = ["downloader"];
handler.limit = true;

export default handler;
