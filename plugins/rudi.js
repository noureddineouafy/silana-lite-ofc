let handler = async (m, { conn, text }) => {
  // Check if user provided a question
  if (!text) return m.reply('Please send your question after the command.');

  // The system prompt for the AI
  const logic = "Your name is Rudi and you are a specialist doctor in urology.";
  const question = text;

  // API URL
  const url = "https://8pe3nv3qha.execute-api.us-east-1.amazonaws.com/default/llm_chat";

  // Prepare the query
  const query = [
    { role: "system", content: logic },
    { role: "user", content: question }
  ];

  const params = new URLSearchParams({
    query: JSON.stringify(query),
    link: "writecream.com"
  });

  try {
    const response = await fetch(`${url}?${params.toString()}`);
    const data = await response.json();

    if (data?.response_content) {
      await m.reply(data.response_content);
    } else {
      await m.reply("I couldn't get a proper response:\n" + JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error(error);
    await m.reply("An error occurred while fetching the response: " + error.message);
  }
};

handler.help = handler.command = ['rudi'];
handler.tags = ['ai'];
export default handler;
