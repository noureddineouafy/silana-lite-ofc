// PDF to Image Converter Plugin
// Scraper core by claidex ( Alfi ) t.me/claidex
// Adapted for Silana Bot by Noureddine Ouafy

import fetch from "node-fetch";
import FormData from "form-data";

const base = "https://pdftoimage.com";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0",
  Accept: "*/*",
  Origin: base,
  Referer: `${base}/`,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── API Helpers ──────────────────────────────────────────────────────────────

async function uploadPDF(buffer, filename = "document.pdf") {
  const form = new FormData();
  form.append("file", buffer, {
    contentType: "application/pdf",
    filename,
  });

  const res = await fetch(`${base}/api/upload`, {
    method: "POST",
    headers: { ...HEADERS, ...form.getHeaders() },
    body: form,
  });

  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

async function startConvert(sid, fid) {
  const res = await fetch(`${base}/api/convert/${sid}/${fid}`, {
    method: "POST",
    headers: HEADERS,
  });
  if (!res.ok) throw new Error(`Convert failed: ${res.status}`);
  return res.json();
}

async function getStatus(sid, fid) {
  const res = await fetch(`${base}/api/status/${sid}/${fid}`, {
    headers: HEADERS,
  });
  if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
  return res.json();
}

async function fetchThumb(sid, fid) {
  const res = await fetch(`${base}/files/${sid}/${fid}/${fid}_thumb.png`, {
    headers: {
      ...HEADERS,
      Accept: "image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5",
    },
  });
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

async function fetchZip(sid, fid, originalName = "document") {
  const url =
    `${base}/api/download-all/${sid}` +
    `?order=${fid}&names=${encodeURIComponent(originalName)}&site=pdftoimage`;

  const res = await fetch(url, {
    headers: {
      ...HEADERS,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// ─── Core Converter ───────────────────────────────────────────────────────────

async function convertPDFBuffer(pdfBuffer, filename = "document.pdf") {
  // 1. Upload
  const upload = await uploadPDF(pdfBuffer, filename);
  if (!upload.success) throw new Error("Upload rejected by server.");

  const { sid, fid, originalName } = upload;

  // 2. Kick off conversion
  await startConvert(sid, fid);

  // 3. Poll until done (max ~90 seconds = 45 attempts × 2s)
  let status;
  let thumbBuffer = null;
  let attempts = 0;

  while (attempts < 45) {
    await sleep(2000);
    attempts++;

    status = await getStatus(sid, fid);

    if (status.status === "success") break;
    if (status.status === "error")
      throw new Error(status.error || "Conversion failed on server.");

    // Grab thumb as soon as it's available (best effort)
    if (status.thumbUrl && !thumbBuffer) {
      try {
        thumbBuffer = await fetchThumb(sid, fid);
      } catch {}
    }
  }

  if (status?.status !== "success")
    throw new Error("Conversion timed out. Please try again.");

  // 4. Download ZIP
  const baseName = (originalName || filename).replace(/\.pdf$/i, "");
  const zipBuffer = await fetchZip(sid, fid, baseName);

  return { zipBuffer, thumbBuffer, sid, fid };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

const GUIDE = `
╭━━━━━━━━━━━━━━━━━━━━━╮
│  📄  PDF to Image   │
╰━━━━━━━━━━━━━━━━━━━━━╯

*What is this?*
Convert any PDF file into high-quality PNG images — one image per page — packed inside a ZIP archive you can extract and share.

*How to use:*
1️⃣  Send or forward a *PDF file* to the chat.
2️⃣  Add the command in the caption:
     *.pdftoimg*

Or reply to an already-sent PDF with:
     *.pdftoimg*

*What you get back:*
• 🖼️ A thumbnail preview of the first page.
• 📦 A ZIP file containing all pages as PNG images.

*Limits & notes:*
• Max PDF size: ~20 MB (WhatsApp upload limit).
• Conversion may take 10–60 seconds depending on page count.
• Works with any standard PDF (scanned or text-based).

_Powered by pdftoimage.com_
`.trim();

let handler = async (m, { conn }) => {
  // ── Show guide if no document attached ────────────────────────────────────
  const quoted = m.quoted || m;
  const mime = (quoted.msg || quoted).mimetype || "";

  if (!mime.includes("pdf")) {
    return conn.reply(m.chat, GUIDE, m);
  }

  // ── Processing notice ─────────────────────────────────────────────────────
  await conn.reply(
    m.chat,
    "⏳ *PDF received!* Converting to images, please wait...\n_This may take up to a minute depending on page count._",
    m
  );

  let pdfBuffer;
  try {
    pdfBuffer = await quoted.download();
  } catch {
    return conn.reply(m.chat, "❌ Failed to download the PDF. Please try again.", m);
  }

  const filename =
    (quoted.msg || quoted).fileName ||
    (quoted.msg || quoted).title ||
    "document.pdf";

  let result;
  try {
    result = await convertPDFBuffer(pdfBuffer, filename);
  } catch (err) {
    console.error("[pdftoimg] Conversion error:", err);
    return conn.reply(
      m.chat,
      `❌ *Conversion failed.*\n\n_${err.message}_\n\nPlease check the PDF and try again.`,
      m
    );
  }

  const { zipBuffer, thumbBuffer } = result;

  // ── Send thumbnail (if available) ─────────────────────────────────────────
  if (thumbBuffer && thumbBuffer.length > 0) {
    try {
      await conn.sendFile(m.chat, thumbBuffer, "preview.png", "🖼️ *First page preview*", m);
    } catch {}
  }

  // ── Send ZIP ──────────────────────────────────────────────────────────────
  const zipName = filename.replace(/\.pdf$/i, "") + "_images.zip";

  try {
    await conn.sendFile(
      m.chat,
      zipBuffer,
      zipName,
      `✅ *Conversion complete!*\n📦 ${zipName}\n\n_Extract the ZIP to get all pages as PNG images._`,
      m
    );
  } catch (err) {
    console.error("[pdftoimg] Send error:", err);
    return conn.reply(m.chat, "❌ Conversion succeeded but failed to send the file. It may be too large.", m);
  }
};

handler.help = handler.command = ["pdftoimg"];
handler.tags = ["tools"];
handler.limit = true;
export default handler;
