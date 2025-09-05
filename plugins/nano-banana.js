// just generate img from txt 
// thanks bro (owner of api)
// noureddine ouafy 
let handler = async (m, { text, conn }) => {
  if (!text) return m.reply(" Please provide some text.");

  try {
    const taskJob = await fetch(
      `https://api.paxsenix.dpdns.org/ai-image/some?text=${encodeURIComponent(text)}&model=nano-banana`
    );

    if (!taskJob.ok) return m.reply("> Sorry, failed to create a task.");

    const taskJobRes = await taskJob.json();
    if (!taskJobRes.task_url) return m.reply("> Task creation failed (no task URL).");

    let attempt = 0;
    const maxAttempts = 20;
    let resultImage = "";

    while (attempt < maxAttempts) {
      try {
        const taskResult = await fetch(taskJobRes.task_url);
        if (!taskResult.ok) throw new Error("Task status request failed.");

        const taskResultRes = await taskResult.json();

        if (taskResultRes.status === "done") {
          resultImage = taskResultRes.url;
          break;
        }

        if (taskResultRes.status === "failed") {
          return m.reply("> Your task has failed.");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }

      attempt++;
      const delay = Math.min(3000 * Math.pow(2, attempt / 5), 60000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    if (!resultImage) return m.reply("> Timed out waiting for image.");

    await conn.sendMessage(m.chat, {
      image: { url: resultImage },
      caption: "There you go!",
    });
  } catch (err) {
    console.error("Handler error:", err);
    m.reply("> Something went wrong while processing your request.");
  }
};

handler.help = ["nano-banana"];
handler.tags = ["ai"];
handler.command = ["nano-banana"];
handler.limit = true
export default handler;
