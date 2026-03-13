// plugin from  Toxic-v2/xhclintohn thanks 🌟
// re-modified by instagram.com/noureddine_ouafy

let handler = async (m, { conn, text }) => {

  // ╭─────────────────────────────────────────╮
  // │           GUIDE / دليل الاستخدام         │
  // ╰─────────────────────────────────────────╯
  //
  // 🎵 PLAY - YouTube Audio Downloader
  // EN: This command searches YouTube and sends the audio (MP3) directly in chat.
  //     You can provide a song name or a YouTube link.
  //     Usage: .play <song name or YouTube URL>
  //     Example: .play funk universo
  //
  // AR: هذا الأمر يبحث في يوتيوب ويرسل الصوت (MP3) مباشرة في المحادثة.
  //     يمكنك كتابة اسم الأغنية أو رابط يوتيوب مباشرة.
  //     الاستخدام: .play <اسم الأغنية أو رابط يوتيوب>
  //     مثال: .play صوت الحرية

  try {
    const query = text ? text.trim() : '';

    if (!query) {
      return m.reply(
        `╭───(    Silana Bot    )───\n` +
        `├ 🇬🇧 You forgot to type something!\n` +
        `├ Give me a song name OR a YouTube link.\n` +
        `├ Example: .play funk universo\n` +
        `├─────────────────────\n` +
        `├ 🇲🇦 نسيتي تكتب شي!\n` +
        `├ عطيني اسم الأغنية أو رابط يوتيوب.\n` +
        `├ مثال: .play صوت الحرية\n` +
        `╰──────────────────☉`
      );
    }

    await conn.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

    if (query.length > 100) {
      return m.reply(
        `╭───(    Silana Bot    )───\n` +
        `├ 🇬🇧 Query too long! Max 100 characters.\n` +
        `├ 🇲🇦 الطلب طويل بزاف! الحد الأقصى 100 حرف.\n` +
        `╰──────────────────☉`
      );
    }

    const response = await fetch(`https://api.nexray.web.id/downloader/ytplay?q=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (!data.status || !data.result?.download_url) {
      await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
      return m.reply(
        `╭───(    Silana Bot    )───\n` +
        `├ 🇬🇧 No results found for: "${query}"\n` +
        `├ Try a different song name or link.\n` +
        `├─────────────────────\n` +
        `├ 🇲🇦 ما لقيناش نتيجة لـ: "${query}"\n` +
        `├ جرب اسم أغنية آخر أو رابط مختلف.\n` +
        `╰──────────────────☉`
      );
    }

    const result     = data.result;
    const audioUrl   = result.download_url;
    const filename   = result.title    || 'Unknown Song';
    const thumbnail  = result.thumbnail || '';
    const sourceUrl  = result.url       || '';
    const duration   = result.duration  || '';
    const views      = result.views     || '';
    const channel    = result.channel   || '';

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    // Send as audio (voice note style)
    await conn.sendMessage(m.chat, {
      audio: { url: audioUrl },
      mimetype: 'audio/mpeg',
      fileName: `${filename}.mp3`,
      contextInfo: thumbnail ? {
        externalAdReply: {
          title: filename.substring(0, 30),
          body: `Silana Bot • ${duration} • ${views} views`,
          thumbnailUrl: thumbnail,
          sourceUrl: sourceUrl,
          mediaType: 1,
          renderLargerThumbnail: true,
        },
      } : undefined,
    }, { quoted: m });

    // Send as downloadable document
    await conn.sendMessage(m.chat, {
      document: { url: audioUrl },
      mimetype: 'audio/mpeg',
      fileName: `${filename.replace(/[<>:"/\\|?*]/g, '_')}.mp3`,
      caption:
        `╭───(    Silana Bot    )───\n` +
        `├───≫ 🎵 PLAY ≪───\n` +
        `├\n` +
        `├ *${filename}*\n` +
        `├ ⏱️ ${duration}  👁️ ${views}  📺 ${channel}\n` +
        `├─────────────────────\n` +
        `├ 🇬🇧 Enjoy your music!\n` +
        `├ 🇲🇦 استمتع بالموسيقى ديالك!\n` +
        `╰──────────────────☉`
    }, { quoted: m });

  } catch (error) {
    console.error('Play error:', error);
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    await m.reply(
      `╭───(    Silana Bot    )───\n` +
      `├───≫ ⚠️ ERROR ≪───\n` +
      `├\n` +
      `├ 🇬🇧 Something went wrong. Try again later.\n` +
      `├ Error: ${error.message}\n` +
      `├─────────────────────\n` +
      `├ 🇲🇦 وقع خطأ. حاول مرة أخرى.\n` +
      `╰──────────────────☉`
    );
  }
};

handler.help = ['play'];
handler.command = /^(play)?$/i;
handler.tags = ['downloader'];
handler.limit = true;

export default handler;
