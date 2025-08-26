let handler = async (m, { conn }) => {
    if (!m.quoted || !m.quoted.download) return m.reply("❌ | المرجو الرد على صورة لإرسالها في الستوري.");

    try {
        let image = await m.quoted.download();
        let caption = "🎵 *موسيقى مرفقة مع الصورة*" // يمكنك تغيير النص حسب الحاجة

        await conn.sendMessage(
            "status@broadcast",
            {
                image,
                caption,
                annotations: [
                    {
                        embeddedContent: {
                            embeddedMusic: {
                                musicContentMediaId: "1055201496437073",
                                songId: "1118085175512946",
                                author: "The.Wav",
                                title: "I L",
                                artworkDirectPath:
                                    "/v/t62.76458-24/27395598_1002020668087405_6722814053980892307_n.enc?ccb=11-4&oh=01_Q5AaIV7SSvDPnWwdNqiI7QkIkie4wiqOi6Qk084isIsr-Wat&oe=67F81BD7&_nc_sid=5e03e0",
                                artworkSha256: "iUgkXuVJp9sfxukOJsZS7NW1YOH46pZHJi77VlHyZMc=",
                                artworkEncSha256: "XuaqRZHVCQPuiFgDYYtBzm5goOe6j9QndoTigxMywp8=",
                                artistAttribution: "https://facebook.com/gregorystutzer",
                                countryBlocklist: "",
                                isExplicit: false,
                                artworkMediaKey: "ezVPzIKc/ffgZKefRVRLLByPBRnkHGqPbR/2K1Renpc=",
                            },
                        },
                        embeddedAction: true,
                    },
                ],
            },
            {
                statusJidList: [m.sender],
            }
        );

        m.reply("✅ | تم نشر الصورة في الستوري مع الموسيقى 🎵");
    } catch (error) {
        console.error(error);
        m.reply("❌ | حدث خطأ أثناء رفع الصورة إلى الستوري.");
    }
};

handler.help = ["storymusic"];
handler.tags = ["owner"];
handler.command = /^storymusic$/i;
handler.owner = true
export default handler;
