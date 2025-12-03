import cp from "child_process";
import { promisify } from "util";
import { createCanvas } from "canvas";
import uploadImage from "../lib/uploadImage.js";

const exec = promisify(cp.exec).bind(cp);

let handler = async (m, { conn }) => {
  await conn.reply(m.chat, "⏳ Capturing server disk usage...", m);

  let output;
  try {
    output = await exec("du -B1 --max-depth=1 | sort -nr");
  } catch (e) {
    output = e;
  } finally {
    let { stdout } = output;
    if (!stdout.trim()) return;

    let lines = stdout
      .trim()
      .split("\n")
      .map((l) => {
        let [sizeStr, path] = l.split("\t");
        let size = parseInt(sizeStr);
        let name = path
          .replace(process.env.HOME + "/", "")
          .replace("./", "");

        return { name, size };
      })
      .filter(
        (item) =>
          !["node_modules", ".cache", ".", ".npm", ""].includes(item.name)
      );

    if (!lines.length) return;

    const formatSize = (size) => {
      const units = ["B", "KB", "MB", "GB", "TB"];
      let i = Math.min(
        Math.floor(Math.log(size) / Math.log(1024)),
        units.length - 1
      );
      return (size / 1024 ** i).toFixed(1) + " " + units[i];
    };

    let totalSize = lines.reduce((a, b) => a + b.size, 0);

    // Canvas size
    const width = 1400,
      height = 800;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, "#0f0c29");
    bg.addColorStop(0.5, "#302b63");
    bg.addColorStop(1, "#24243e");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = "#00fff7";
    ctx.lineWidth = 6;
    ctx.shadowColor = "#00fff788";
    ctx.shadowBlur = 18;
    ctx.strokeRect(20, 20, width - 40, height - 40);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#00fff7";
    ctx.font = "bold 54px Sans-serif";
    ctx.fillText("", 60, 100);

    const barSpacing = 30;
    const usableWidth = width - 160 - (lines.length - 1) * barSpacing;
    const barWidth = Math.max(60, Math.floor(usableWidth / lines.length));
    const maxBarHeight = height - 260;
    const maxSize = Math.max(...lines.map((l) => l.size));

    // Bar chart
    lines.forEach((item, i) => {
      const hue = (i * 360) / lines.length;
      const color = `hsl(${hue},100%,60%)`;
      const barHeight = (item.size / maxSize) * maxBarHeight;

      const x = 80 + i * (barWidth + barSpacing);
      const y = height - barHeight - 140;

      const grad = ctx.createLinearGradient(x, y, x, y + barHeight);
      grad.addColorStop(0, color);
      grad.addColorStop(1, "#000");

      ctx.shadowColor = color + "aa";
      ctx.shadowBlur = 20;

      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barWidth, barHeight);

      ctx.shadowBlur = 0;

      // Size label
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 20px Sans-serif";
      ctx.fillText(formatSize(item.size), x + barWidth / 2, y - 14);

      // Names rotated
      ctx.save();
      ctx.translate(x + barWidth / 2, height - 60);
      ctx.rotate(-Math.PI / 6);
      ctx.fillStyle = "#ccc";
      ctx.font = "18px Sans-serif";
      ctx.fillText(item.name, 0, 0);
      ctx.restore();
    });

    // Total size
    ctx.textAlign = "left";
    ctx.fillStyle = "#00fff7";
    ctx.font = "22px Sans-serif";
    ctx.fillText("Total: " + formatSize(totalSize), 60, height - 30);

    // Caption text
    const caption = lines
      .map((item) => `${formatSize(item.size)}\t./${item.name}`)
      .join("\n");

    // Convert canvas -> buffer -> upload
    const img = canvas.toBuffer("image/png");
    let uploaded = await uploadImage(img);

    await conn.sendMessage(
      m.chat,
      {
        text: caption,
        contextInfo: {
          externalAdReply: {
            title: "Disk Usage Information",
            body: "Bot Server Disk Usage",
            thumbnailUrl: uploaded,
            sourceUrl: global.sig || "",
            renderLargerThumbnail: true,
            mediaType: 1,
            previewType: 1,
          },
        },
      },
      { quoted: m }
    );
  }
};

handler.help = ["infodisk"];
handler.tags = ["tools"];
handler.command = ["infodisk"];

export default handler;
