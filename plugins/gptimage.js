// Instagram: noureddine_ouafy
// scrape: From daffa Channel 
let handler = async (m, { conn, args }) => {
  let prompt = args.join(" ");
  if (!prompt) return m.reply("المرجو وصف الصورة التي تريد إنشاؤها.");

  m.reply("المرجو الانتظار قليلا لا تنسى ان تتابع \ninstagram.com/noureddine_ouafy");

  try {
    const imageUrl = await gpt1image(prompt);
    await conn.sendFile(m.chat, imageUrl, 'generated.png', `تم إنشاء الصورة بناءً على الوصف:\n"${prompt}"`, m);
  } catch (e) {
    m.reply("حدث خطأ أثناء محاولة إنشاء الصورة:\n" + e.message);
  }
};

handler.help = handler.command = ['gptimage'];
handler.tags = ['ai'];
handler.limit = true;
export default handler;

const gpt1image = async (yourImagination) => {
  if (!yourImagination) throw Error("وصف الصورة مفقود.");

  const headers = {
    "content-type": "application/json",
    "referer": "https://gpt1image.exomlapi.com/",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
  };

  const body = JSON.stringify({
    prompt: yourImagination,
    n: 1,
    size: "1024x1024",
    is_enhance: true,
    response_format: "url"
  });

  const res = await fetch("https://gpt1image.exomlapi.com/v1/images/generations", {
    method: "POST",
    headers,
    body
  });

  if (!res.ok) throw Error(`فشل في جلب الصورة من ${res.url}: ${res.status} ${res.statusText}`);
  const data = await res.json();

  const url = data?.data?.[0]?.url;
  if (!url) throw Error("تم بنجاح ولكن لم يتم العثور على رابط الصورة.");
  return url;
};
