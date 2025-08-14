//plugin by noureddine ouafy
// scrape by GilangSan


import { createCanvas, loadImage } from "canvas";
import fetch from 'node-fetch';
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}
function wrapText(ctx, text, maxWidth) {
    const words = text.split(" ");
    let lines = [];
    let line = "";
    for (let word of words) {
        const testLine = line + word + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line.length > 0) {
            lines.push(line.trim());
            line = word + " ";
        } else {
            line = testLine;
        }
    }
    if (line.length > 0) lines.push(line.trim());
    return lines;
}


async function generateCommentBuffer({
    username = "User",
    comment = "This is a sample comment.",
    profilePicBuffer = null
}) {
    // --- Configuration ---
    const scale = 4; // Increases resolution for a clearer image
    const maxWidth = 210;
    const lineHeight = 25;
    const fontMain = "bold 18px 'Segoe UI', Arial, sans-serif";
    const fontReply = "14px 'Segoe UI', Arial, sans-serif";

    // --- Calculate dynamic canvas dimensions ---
    const tempCanvas = createCanvas(1, 1);
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.font = fontMain;
    const lines = wrapText(tempCtx, comment, maxWidth);

    const textHeight = lines.length * lineHeight;
    const bubbleHeight = textHeight + 45; // Adjusted padding
    const bubbleWidth = maxWidth + 40;

    const canvas = createCanvas((bubbleWidth + 20) * scale, (bubbleHeight + 20) * scale);
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);

    // --- Draw background and bubble ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 2;
    roundRect(ctx, 10, 10, bubbleWidth, bubbleHeight, 20); // Softer radius
    ctx.fill();
    ctx.shadowColor = "transparent"; // Reset shadow

    // --- Draw Profile Picture ---
    if (profilePicBuffer) {
        try {
            const img = await loadImage(profilePicBuffer);
            ctx.save();
            ctx.beginPath();
            ctx.arc(40, 42, 15, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, 25, 27, 30, 30);
            ctx.restore();
        } catch (err) {
            console.warn("⚠️ Failed to load profile picture:", err.message);
        }
    }

    // --- Draw Text ---
    ctx.fillStyle = "black";
    ctx.font = fontMain;
    let y = 48; // Initial Y position for text
    for (const line of lines) {
        ctx.fillText(line, 70, y);
        y += 22; // Line spacing
    }

    // --- Draw "Replying to" text ---
    ctx.fillStyle = "#657786"; // Twitter-like grey color
    ctx.font = fontReply;
    ctx.fillText(`Replying to @${username}`, 70, bubbleHeight - 8);

    return canvas.toBuffer("image/png");
}


// --- BOT HANDLER ---
let handler = async (m, { conn, text }) => {
    if (!text) throw 'Please provide the text you want to appear in the comment.\n\n*Example:* .comment Hello world!';

    await m.reply('🎨 Generating your comment image...');

    let ppBuffer;
    try {
        const ppUrl = await conn.profilePictureUrl(m.sender, 'image');
        ppBuffer = await (await fetch(ppUrl)).buffer();
    } catch (e) {
        // Use a default placeholder if fetching the profile picture fails
        console.error("Could not fetch profile picture, using default.", e);
        ppBuffer = null; // The generator function will handle the null case
    }

    try {
        const resultBuffer = await generateCommentBuffer({
            username: m.pushName || "User",
            comment: text,
            profilePicBuffer: ppBuffer
        });

        // Send the generated image back to the user
        await conn.sendFile(m.chat, resultBuffer, 'comment.png', 'Here is your generated comment:', m);
    } catch (error) {
        console.error("Error generating comment image:", error);
        m.reply("❌ An error occurred while creating the image. Please try again later.");
    }
};

handler.help = ['replycomment'];
handler.command = ['replycomment','comment'];
handler.tags = ['tools'];
handler.limit = true;
export default handler;
