import sharp from "sharp";
import { unlink, mkdir, rm, readFile } from "fs/promises";
import { randomBytes } from "crypto";
import path from "path";
import { spawn } from "child_process";
import { tmpdir } from "os";

let handler = async (m, { conn, usedPrefix, command }) => {

  if (!m.quoted) {
    throw `
🎬 *Sticker/Audio to Video Converter*

Reply to a sticker or audio message with:
${usedPrefix + command}

Example:
• Reply to a sticker → type *${usedPrefix + command}*
• Reply to an audio → type *${usedPrefix + command}*
`;
  }

  m.react("⏳");

  let mime = m.quoted.mimetype || "";
  if (!/webp|audio/.test(mime)) {
    throw `Please reply to a *sticker* or *audio* message with caption *${usedPrefix + command}*`;
  }

  let media = await m.quoted.download();
  let out = Buffer.alloc(0);

  try {

    // ==============================
    // STICKER → VIDEO
    // ==============================
    if (/webp/.test(mime)) {

      const tempDir = path.join(tmpdir(), `frames-${randomBytes(8).toString("hex")}`);
      const tempOutputFile = path.join(tmpdir(), `video-${randomBytes(8).toString("hex")}.mp4`);

      let metadata;
      try {
        metadata = await sharp(media, { animated: true }).metadata();
      } catch {
        metadata = await sharp(media).metadata();
      }

      const isAnimated = (metadata.pages || 1) > 1;

      if (isAnimated) {

        await mkdir(tempDir, { recursive: true });

        const frameCount = metadata.pages || 1;
        const delay = metadata.delay || [];
        const avgDelay =
          delay.length > 0
            ? delay.reduce((a, b) => a + b, 0) / delay.length
            : 40;

        const fps = Math.min(Math.round(1000 / avgDelay), 25);
        const maxFrames = Math.min(frameCount * 3, fps * 3);
        const loopCount = Math.ceil(maxFrames / frameCount);

        let frameIndex = 0;

        for (let loop = 0; loop < loopCount; loop++) {
          for (let i = 0; i < frameCount; i++) {
            if (frameIndex >= maxFrames) break;

            const framePath = path.join(
              tempDir,
              `frame_${frameIndex.toString().padStart(4, "0")}.png`
            );

            await sharp(media, { page: i })
              .resize(512, 512, {
                fit: "contain",
                background: { r: 255, g: 255, b: 255, alpha: 1 },
              })
              .png()
              .toFile(framePath);

            frameIndex++;
          }
        }

        await new Promise((resolve, reject) => {
          const proc = spawn("ffmpeg", [
            "-framerate", fps.toString(),
            "-i", path.join(tempDir, "frame_%04d.png"),
            "-f", "lavfi",
            "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-c:a", "aac",
            "-pix_fmt", "yuv420p",
            "-shortest",
            "-y",
            tempOutputFile,
          ]);

          proc.on("close", code => code === 0 ? resolve() : reject());
          proc.on("error", reject);
        });

        await rm(tempDir, { recursive: true, force: true });

      } else {

        const pngBuffer = await sharp(media)
          .resize(512, 512, {
            fit: "contain",
            background: { r: 255, g: 255, b: 255, alpha: 1 },
          })
          .png()
          .toBuffer();

        await new Promise((resolve, reject) => {
          const proc = spawn("ffmpeg", [
            "-loop", "1",
            "-framerate", "25",
            "-i", "pipe:0",
            "-f", "lavfi",
            "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
            "-c:v", "libx264",
            "-c:a", "aac",
            "-pix_fmt", "yuv420p",
            "-t", "3",
            "-shortest",
            "-y",
            tempOutputFile,
          ]);

          proc.stdin.write(pngBuffer);
          proc.stdin.end();

          proc.on("close", code => code === 0 ? resolve() : reject());
          proc.on("error", reject);
        });
      }

      out = await readFile(tempOutputFile);
      await unlink(tempOutputFile);

    }

    // ==============================
    // AUDIO → VIDEO
    // ==============================
    else if (/audio/.test(mime)) {

      const tempFile = path.join(tmpdir(), `video-${randomBytes(8).toString("hex")}.mp4`);

      await new Promise((resolve, reject) => {
        const proc = spawn("ffmpeg", [
          "-f", "lavfi",
          "-i", "color=c=black:s=640x480:r=25",
          "-i", "pipe:0",
          "-c:v", "libx264",
          "-tune", "stillimage",
          "-c:a", "aac",
          "-pix_fmt", "yuv420p",
          "-shortest",
          "-y",
          tempFile,
        ]);

        proc.stdin.write(media);
        proc.stdin.end();

        proc.on("close", code => code === 0 ? resolve() : reject());
        proc.on("error", reject);
      });

      out = await readFile(tempFile);
      await unlink(tempFile);
    }

    if (!out || out.length === 0) throw "Failed to generate video.";

    m.react("✅");
    await conn.sendFile(m.chat, out, `video-${Date.now()}.mp4`, "🎬 Conversion Successful!", m);

  } catch (err) {
    console.error(err);
    m.react("❌");
    throw "Failed to convert to video.";
  }
};

handler.help = ["tovideo"];
handler.command = ["tovideo"];
handler.tags = ["sticker"];
handler.limit = true;

export default handler;
