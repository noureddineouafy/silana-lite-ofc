// Noroshi
// recod by noureddine ouafy 
import { loadImage, createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text || !text.includes('|')) {
    return m.reply(
      `🚩 Incorrect format.\n` +
      `Example: ${usedPrefix}${command} Noureddine ouafy| +212717457920 | Busy\n` +
      `Reply to the target's profile picture for a custom avatar.`
    );
  }

  // Split the input text by '|' and trim whitespace from each part.
  let [name, number, status] = text.split('|').map(v => v.trim());
  
  // Ensure that name and number are provided.
  if (!name || !number) return m.reply('❌ Name and number are required.');
  
  // Set a default status if it's not provided.
  status = status || 'Busy';

  // Inform the user that the image is being created.
  await m.reply('⏳ Creating Fake WhatsApp Profile...');

  try {
    let profilePicUrl;
    
    // Check if the message is a reply to an image message to use as a custom profile picture.
    if (m.quoted && m.quoted.mtype === 'imageMessage') {
      const media = await conn.downloadAndSaveMediaMessage(m.quoted);
      profilePicUrl = media;
    } else {
      // Otherwise, try to get the sender's profile picture.
      try {
        profilePicUrl = await conn.profilePictureUrl(m.sender, 'image');
      } catch {
        // Use a default placeholder image if the profile picture cannot be fetched.
        profilePicUrl = 'https://telegra.ph/file/1ecdb5a0aee62ef17d7fc.jpg'; // Default avatar
      }
    }

    // Load the avatar and background images concurrently.
    const [avatar, background] = await Promise.all([
      loadImage(profilePicUrl),
      loadImage('https://files.catbox.moe/1zmbfd.jpg') // Background template
    ]);

    // Create a canvas with the dimensions of the background image.
    const canvas = createCanvas(background.width, background.height);
    const ctx = canvas.getContext('2d');

    // Draw the background image onto the canvas.
    ctx.drawImage(background, 0, 0);

    // --- Draw Circular Avatar ---
    const avatarSize = 350;
    const avatarX = (canvas.width - avatarSize) / 2;
    const avatarY = 163;
    ctx.save(); // Save the current canvas state
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip(); // Clip the drawing region to the circular path
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore(); // Restore the canvas state to remove the clipping mask

    // --- Draw "Edit" text below the avatar ---
    ctx.fillStyle = '#25D366'; // WhatsApp green
    ctx.font = '25px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Edit', avatarX + avatarSize / 2, avatarY + avatarSize + 104);

    // --- Cover Indonesian Labels and Draw English Content ---
    const startX = 165;
    const startY = 710;
    const gapY = 150;
    const coverRectHeight = 80;
    const coverRectWidth = 850;
    const labelYOffset = 25;
    const valueYOffset = 70;

    // Define the labels and values
    const fields = [
        { label: 'Name', value: name },
        { label: 'About', value: status },
        { label: 'Phone', value: formatPhoneNumber(number) },
        { label: 'Link', value: 'Instagram' } // Placeholder for a link
    ];

    // Loop through fields to cover old text and draw new text
    fields.forEach((field, index) => {
        const currentY = startY + (index * gapY);
        
        // Cover the old Indonesian label and value with a dark rectangle
        ctx.fillStyle = '#111b21'; // Dark background color of the section
        ctx.fillRect(startX - 60, currentY, coverRectWidth, coverRectHeight);

        // Draw the new English label
        ctx.textAlign = 'left';
        ctx.font = '30px Arial';
        ctx.fillStyle = '#a7a4a4'; // Gray color for labels
        ctx.fillText(field.label, startX, currentY + labelYOffset);

        // Draw the new value
        ctx.fillStyle = '#ffffff'; // White color for values
        ctx.fillText(field.value, startX, currentY + valueYOffset);
    });
    
    // Helper function to format the phone number
    function formatPhoneNumber(n) {
      if (n.startsWith('08')) n = '62' + n.slice(1); // Convert local Indonesian number
      if (n.startsWith('62') && n.length >= 10) {
        return `+62 ${n.slice(2, 5)}-${n.slice(5, 9)}-${n.slice(9)}`;
      } else if (n.startsWith('+')) {
        return n;
      } else if (/^\d+$/.test(n)) {
        return `+${n}`;
      } else {
        return n;
      }
    }

    // Convert the canvas to a buffer.
    const buffer = canvas.toBuffer('image/png');
    
    // Send the generated image with a caption.
    await conn.sendMessage(m.chat, {
      image: buffer,
      caption: 'Fake WhatsApp Profile by Noroshi'
    }, { quoted: m });

  } catch (err) {
    console.error('[FAKEWA ERROR]', err);
    m.reply('❌ Failed to create Fake WhatsApp Profile: ' + err.message);
  }
};

// Define command metadata.
handler.help = ['fakewa'];
handler.tags = ['tools'];
handler.command = /^fakewa$/i;
handler.limit = true;
// Export the handler using ESM syntax.
export default handler;
