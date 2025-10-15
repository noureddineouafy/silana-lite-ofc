// instagram.com/noureddine_ouafy
import { areJidsSameUser } from '@adiwajshing/baileys'

function resolveJid(input, participants = []) {
  const found = participants.find(
    p =>
      areJidsSameUser(p?.id, input) ||
      areJidsSameUser(p?.lid, input) ||
      areJidsSameUser(p?.jid, input)
  )
  return found?.id || input
}

let voteKick = {}

let handler = async (m, { conn, text, usedPrefix, command, participants }) => {
  if (!text && !m.mentionedJid[0])
    throw `Example:\n${usedPrefix + command} @user`

  let who = m.mentionedJid[0] || text.trim()
  if (!who) throw `Tag or enter the target number.`

  who = resolveJid(who, participants)

  let id = m.chat
  if (voteKick[id]) throw `⚠️ There’s already an active voting session in this group.`

  voteKick[id] = {
    target: who,
    kick: new Set(),
    keep: new Set(),
    voted: new Set(),
    startMsg: null,
    timer: null
  }

  let caption = `📢 *Vote Kick Started!*\n\n👤 Target: @${who.split('@')[0]}\n\nReply to this message with a number:\n1 = Agree to Kick\n2 = Disagree\n\nThe final result will be decided based on the majority vote.\n⏳ Time limit: 3 minutes`

  const sent = await conn.sendMessage(m.chat, { text: caption, mentions: [who] }, { quoted: m })
  voteKick[id].startMsg = sent

  voteKick[id].timer = setTimeout(async () => {
    if (!voteKick[id]) return
    let { target, kick, keep } = voteKick[id]

    let result = `📊 *Voting Ended!*\n👤 Target: @${target.split('@')[0]}\n\nKick: ${kick.size}\nKeep: ${keep.size}\n\n`
    if (kick.size > keep.size) {
      result += '✅ Result: The target has been *kicked*.'
      await conn.groupParticipantsUpdate(id, [target], 'remove')
    } else if (keep.size > kick.size) {
      result += '❎ Result: The target *will stay*.'
    } else {
      result += '⚖️ Result: It’s a tie! The target *stays safe*.'
    }

    await conn.sendMessage(id, { text: result, mentions: [target] })
    delete voteKick[id]
  }, 180000)
}

handler.before = async function (m, { conn }) {
  let id = m.chat
  if (!voteKick[id]) return
  if (!['1', '2'].includes(m.text?.trim())) return

  const quotedId = m.quoted?.id || m.quoted?.key?.id
  const startId = voteKick[id].startMsg?.id || voteKick[id].startMsg?.key?.id

  if (!quotedId || quotedId !== startId) {
    return conn.sendMessage(id, {
      text: `⚠️ @${m.sender.split('@')[0]}, you must *reply to the initial voting message* to cast your vote.`,
      mentions: [m.sender]
    }, { quoted: voteKick[id].startMsg })
  }

  let user = m.sender
  let target = voteKick[id].target
  let choice = m.text.trim()

  if (voteKick[id].voted.has(user)) {
    return m.reply(`⚠️ @${user.split('@')[0]}, you already voted and cannot change your choice.`, null, { mentions: [user] })
  }

  if (choice === '1') {
    voteKick[id].kick.add(user)
    voteKick[id].voted.add(user)
    await m.reply(
      `[ VOTE KICK ]\n@${user.split('@')[0]} voted to *KICK* @${target.split('@')[0]}\n\nKick: ${voteKick[id].kick.size}\nKeep: ${voteKick[id].keep.size}`,
      null,
      { mentions: [user, target] }
    )
  }

  if (choice === '2') {
    voteKick[id].keep.add(user)
    voteKick[id].voted.add(user)
    await m.reply(
      `[ VOTE KEEP ]\n@${user.split('@')[0]} voted to *KEEP* @${target.split('@')[0]}\n\nKick: ${voteKick[id].kick.size}\nKeep: ${voteKick[id].keep.size}`,
      null,
      { mentions: [user, target] }
    )
  }
}

handler.help = ['votekick']
handler.tags = ['owner']
handler.command = ['votekick']
handler.register = false
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
