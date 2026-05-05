// ============================================================
// scrape by claidexdeveloper
// plugin by noureddine ouafy 

// 📌 GUIDE — imgupload (Photo to URL Uploader)
// ============================================================
// WHAT IT DOES:
//   Uploads any image you send to a free cloud host and
//   returns a public direct link you can share anywhere.
//
// HOW TO USE:
//   1. Send an image (photo/sticker) to the bot.
//   2. Add the command in the caption:  .imgupload
//      OR reply to any image with:      .imgupload
//
// EXAMPLE:
//   [Attach a photo]  caption → .imgupload
//   Bot replies with a CDN link like:
//   https://cdn.phototourl.com/free/2026-xx-xx-xxxx.png
//
// NOTES:
//   • Only image files are supported (JPEG, PNG, WEBP …).
//   • Uploaded images are hosted on the "free" plan —
//     they may expire after some time.
//   • One image per command.
// ============================================================

import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFile, unlink } from "node:fs/promises";

let handler = async (m, { conn }) => {
  // ── 1. Locate the quoted or direct image message ──────────
  const msg =
    m.quoted
      ? m.quoted
      : m;

  const mime = (msg.msg || msg).mimetype || "";

  if (!mime.startsWith("image/")) {
    return conn.reply(
      m.chat,
      "❌ *No image found!*\n\nPlease send an image with the caption `.imgupload` or reply to an image with `.imgupload`.",
      m
    );
  }

  await conn.reply(m.chat, "⏳ Uploading your image, please wait…", m);

  // ── 2. Download the media into a temp file ────────────────
  const mediaBuffer = await msg.download();
  const ext = mime.split("/")[1].split(";")[0]; // e.g. "png", "jpeg"
  const tmpPath = join(tmpdir(), `imgupload_${Date.now()}.${ext}`);
  await writeFile(tmpPath, mediaBuffer);

  // ── 3. Upload to phototourl.com ───────────────────────────
  let resultUrl;
  try {
    const form = new FormData();
    form.append(
      "file",
      new Blob([mediaBuffer], { type: mime }),
      `image.${ext}`
    );

    const res = await fetch("https://phototourl.com/api/upload", {
      method: "POST",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0",
        Referer: "https://phototourl.com/",
        Origin: "https://phototourl.com",
        Cookie: "NEXT_LOCALE=en",
      },
      body: form,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    if (!data?.url) throw new Error("No URL in response");
    resultUrl = data.url;
  } catch (err) {
    return conn.reply(
      m.chat,
      `❌ *Upload failed!*\n\nError: ${err.message}\n\nPlease try again later.`,
      m
    );
  } finally {
    // ── 4. Clean up temp file ─────────────────────────────
    await unlink(tmpPath).catch(() => {});
  }

  // ── 5. Reply with the public link ────────────────────────
  const reply =
    `✅ *Image Uploaded Successfully!*\n\n` +
    `🔗 *Direct Link:*\n${resultUrl}\n\n` +
    `_Tap and hold the link to copy it._`;

  await conn.reply(m.chat, reply, m);
};

handler.help = handler.command = ["imgupload"];

handler.tags = ["uploader"];

handler.limit = true;

export default handler;
