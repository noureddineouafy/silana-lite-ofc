// ====================================================
// 🇲🇦 WELCOME/GOODBYE PLUGIN - راية المغرب
// instagram.com/noureddine_ouafy
// ====================================================

import { WAMessageStubType } from '@adiwajshing/baileys'
import { createCanvas, loadImage } from 'canvas'

export async function before(m, { conn, participants, groupMetadata }) {
  if (!m.isGroup || !m.messageStubType) return true

  const dev = 'Silana'

  const fkontak = {
    key: {
      participants: "0@s.whatsapp.net",
      remoteJid: "status@broadcast",
      fromMe: false,
      id: "Halo"
    },
    message: {
      contactMessage: {
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:${dev}\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
      }
    },
    participant: "0@s.whatsapp.net"
  }

  const stubParams = m.messageStubParameters || []
  if (!Array.isArray(stubParams) || stubParams.length === 0) return true

  let chat = global.db.data.chats[m.chat] || {}
  if (typeof chat.welcome === 'undefined') chat.welcome = true
  if (!chat.welcome) return true

  const userJid  = stubParams[0]
  const username = userJid.split('@')[0]
  const mention  = '@' + username
  const initialMemberCount = groupMetadata.participants?.length || 0

  // ─── صورة البروفيل ───────────────────────────────────
  let avatarUrl
  try {
    avatarUrl = await conn.profilePictureUrl(userJid, 'image')
  } catch {
    avatarUrl = 'https://i.imgur.com/8B4QYQY.png'
  }

  // ─── رسم نجمة المغرب (خطوط صفراء بدون ملء) ──────────
  function drawStar(ctx, cx, cy, outerR, innerR) {
    const points = 5
    ctx.beginPath()
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2
      const r     = i % 2 === 0 ? outerR : innerR
      const x     = cx + r * Math.cos(angle)
      const y     = cy + r * Math.sin(angle)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth   = 4
    ctx.stroke()
  }

  // ─── بناء الصورة ─────────────────────────────────────
  async function buildMoroccoImage(type, memberCount) {
    const W = 800, H = 400
    const canvas = createCanvas(W, H)
    const ctx    = canvas.getContext('2d')

    // خلفية سوداء
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, W, H)

    // منطقة الراية
    const flagY = 75, flagH = 250

    ctx.fillStyle = '#000000'
    ctx.fillRect(0, flagY, W, flagH)

    // شريط أخضر علوي
    ctx.fillStyle = '#006233'
    ctx.fillRect(0, flagY, W, 22)

    // شريط أخضر سفلي
    ctx.fillStyle = '#006233'
    ctx.fillRect(0, flagY + flagH - 22, W, 22)

    // ── صورة الأفاتار (دائرية) ──
    const avatarSize = 140
    const avatarX    = 55
    const avatarY    = flagY + (flagH - avatarSize) / 2

    try {
      const avatarImg = await loadImage(avatarUrl)
      ctx.save()
      ctx.beginPath()
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize)
      ctx.restore()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth   = 4
      ctx.beginPath()
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 4, 0, Math.PI * 2)
      ctx.stroke()
    } catch {}

    // ── نجمة المغرب على اليمين ──
    drawStar(ctx, W - 90, flagY + flagH / 2, 58, 23)

    // ── النصوص بدعم RTL ──
    ctx.direction = 'rtl'
    ctx.textAlign = 'right'
    const textX     = W - 160
    const textBaseY = flagY + 62

    if (type === 'welcome') {
      ctx.font      = 'bold 34px serif'
      ctx.fillStyle = '#ffffff'
      ctx.fillText('» مرحباً بك! «', textX, textBaseY)

      ctx.font      = 'bold 23px serif'
      ctx.fillStyle = '#FFD700'
      ctx.fillText(`@${username}`, textX, textBaseY + 48)

      ctx.font      = '19px serif'
      ctx.fillStyle = '#ffffff'
      const gName = groupMetadata.subject.length > 20
        ? groupMetadata.subject.slice(0, 20) + '...'
        : groupMetadata.subject
      ctx.fillText(`في ${gName}`, textX, textBaseY + 86)

      ctx.font      = '18px serif'
      ctx.fillStyle = '#dddddd'
      ctx.fillText(`الاعضاء: ${memberCount}`, textX, textBaseY + 124)

    } else {
      ctx.font      = 'bold 34px serif'
      ctx.fillStyle = '#ffffff'
      ctx.fillText('« وداعاً... »', textX, textBaseY)

      ctx.font      = 'bold 23px serif'
      ctx.fillStyle = '#FFD700'
      ctx.fillText(`@${username}`, textX, textBaseY + 48)

      ctx.font      = '19px serif'
      ctx.fillStyle = '#ffffff'
      const gName = groupMetadata.subject.length > 20
        ? groupMetadata.subject.slice(0, 20) + '...'
        : groupMetadata.subject
      ctx.fillText(`غادر ${gName}`, textX, textBaseY + 86)

      ctx.font      = '18px serif'
      ctx.fillStyle = '#dddddd'
      ctx.fillText(`الاعضاء: ${memberCount}`, textX, textBaseY + 124)
    }

    // ── شعار المطور ──
    ctx.direction  = 'ltr'
    ctx.textAlign  = 'center'
    ctx.font       = '13px serif'
    ctx.fillStyle  = '#777777'
    ctx.fillText(`Powered by ${dev}`, W / 2, H - 10)

    return canvas.toBuffer('image/jpeg', { quality: 0.93 })
  }

  // ─── استقبال عضو جديد ────────────────────────────────
  if (
    m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_ADD ||
    m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_INVITE
  ) {
    const memberCount = initialMemberCount

    const defaultWelcome =
      `*مرحباً @user في @subject!*\n\n` +
      `أنا *${dev}*، مساعدك الذكي\n` +
      `> عدد الاعضاء الآن: ${memberCount}\n` +
      `> اقرأ القوانين قبل المشاركة\n` +
      `> اكتب *#menu* لاكتشاف الاوامر\n\n` +
      `اهلاً وسهلاً بك!`

    const welcomeText = (chat.welcomeText || defaultWelcome)
      .replace('@user', mention)
      .replace('@subject', groupMetadata.subject)
      .replace('@desc', groupMetadata.desc?.toString() || '')

    let imgBuffer
    try { imgBuffer = await buildMoroccoImage('welcome', memberCount) }
    catch (e) { console.error('خطأ في الصورة:', e) }

    await conn.sendMessage(m.chat, {
      ...(imgBuffer ? { image: imgBuffer } : {}),
      caption: welcomeText,
      mentions: [userJid]
    }, { quoted: fkontak })

  // ─── مغادرة عضو ──────────────────────────────────────
  } else if (
    m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_LEAVE ||
    m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_REMOVE
  ) {
    const memberCount = initialMemberCount - 1

    const defaultBye =
      `*وداعاً @user...*\n\n` +
      `نتمنى لك التوفيق خارج @subject\n` +
      `> عدد الاعضاء الآن: ${memberCount}`

    const byeText = (chat.byeText || defaultBye)
      .replace('@user', mention)
      .replace('@subject', groupMetadata.subject)

    let imgBuffer
    try { imgBuffer = await buildMoroccoImage('goodbye', memberCount) }
    catch (e) { console.error('خطأ في الصورة:', e) }

    await conn.sendMessage(m.chat, {
      ...(imgBuffer ? { image: imgBuffer } : {}),
      caption: byeText,
      mentions: [userJid]
    }, { quoted: fkontak })
  }

  return true
}
