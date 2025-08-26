let handler = async (m, { conn }) => {
  // Define the bot owner's ID
  const ownerId = '212717457920'; // Owner's ID

  // Strip '@c.us' if it's part of the sender ID
  const senderId = m.sender.split('@')[0];

  console.log(`Sender ID: ${senderId}`);  // Print the sender ID for debugging

  // Check if the sender is the owner
  if (senderId !== ownerId) {
    return conn.sendMessage(m.chat, { text: "This command is restricted to the bot owner." }); // Notify non-owners
  }

  // Extract the command text (for example: .upch-audio title | description)
  const text = m.text.trim();
  
  // Split the text to get title and description
  const anu = text.split("|")[0];  // Extract title (before the |)
  const ppk = text.split("|")[1];  // Extract description (after the |)

  if (!anu || !ppk) {
    return conn.sendMessage(m.chat, { text: "Please send a valid title and description separated by |" });
  }

  // Check if the message contains any audio or video attachment
  let mime = '';
  
  // Check if the message contains audio or video from the quoted message
  if (m.quoted && m.quoted.mtype) {
    mime = m.quoted.mtype;
  }

  // Or check for direct attachment in the message
  if (m.message) {
    if (m.message.audioMessage) {
      mime = 'audio';
    } else if (m.message.videoMessage) {
      mime = 'video';
    } else if (m.message.documentMessage) {
      mime = m.message.documentMessage.mimetype || '';
    }
  }

  // Check if mime is empty or not audio/video
  if (!mime || (!/audio/.test(mime) && !/video/.test(mime))) {
    return conn.sendMessage(m.chat, { text: "Please send a valid audio or video file." }); // Notify user if not audio or video
  }

  // Send a 'waiting' reaction to the chat
  conn.sendMessage(m.chat, { react: { text: '🕐', key: m.key } });

  // Wait for 6 seconds before sending the message
  await sleep(6000);

  // Updated channel ID
  const channelId = '120363377359042191@newsletter';

  // Define bot name
  const botname = 'Silana Bot';  // You can change this to your bot's name

  // Define thumbnail image (replace this with your own image URL)
  const thumbReply = 'https://files.catbox.moe/hnbuh3.jpg';  // Replace with actual thumbnail image URL

  // Send the audio to the channel
  conn.sendMessage(channelId, {
    audio: await m.quoted.download(),
    mimetype: 'audio/mp4',
    ptt: true,
    contextInfo: {
      mentionedJid: [m.sender],
      forwardingScore: 9999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: channelId,
        serverMessageId: 20,
        newsletterName: botname
      },
      externalAdReply: {
        title: anu,
        body: ppk,
        thumbnailUrl: thumbReply,
        sourceUrl: null,
        mediaType: 1
      }
    }
  });

  // Wait for 2 seconds
  await sleep(2000);

  // Send a 'success' reaction to the chat
  conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
};

// Sleep function to delay execution for a specified time in milliseconds
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

handler.help = handler.command = ['upch-audio'];
handler.tags = ['owner'];
handler.owner = true 
export default handler;
