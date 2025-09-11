// instagram.com/noureddine_ouafy
let before = async function (m, { isBotAdmin, isAdmin, conn }) {
  const regex = /https:\/\/whatsapp\.com\/channel\/[A-Za-z0-9]{22}/
  if (regex.test(m.text)) {
    if (isAdmin) return
    if (!isBotAdmin) return

    await conn.sendMessage(
      m.chat,
      {
        text: `*[ Channel detected ]* You can't send another channel in this group. Sorry, I will delete this.`
      },
      { quoted: m }
    )

    await conn.sendMessage(m.chat, { delete: m.key })
  }
}

export default { before }
