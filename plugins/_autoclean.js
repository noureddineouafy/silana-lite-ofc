// ╔══════════════════════════════════════════════════╗
// ║         AUTO CLEAN /tmp — SILANA LITE AI         ║
// ║   يحذف ملفات /tmp تلقائياً كل 30 دقيقة          ║
// ╚══════════════════════════════════════════════════╝
// plugin by noureddine ouafy 
// by Claude Ai 
import fs from 'fs'
import path from 'path'

const TMP_DIR     = '/tmp'
const INTERVAL_MS = 30 * 60 * 1000  // كل 30 دقيقة
const MAX_AGE_MS  = 60 * 60 * 1000  // احذف الملفات الأكبر من ساعة
const OWNER_JID   = '212717457920@s.whatsapp.net'

function cleanTmp(notify = false) {
  try {
    const files = fs.readdirSync(TMP_DIR)
    const now   = Date.now()
    let deleted = 0
    let freed   = 0

    for (const file of files) {
      const filePath = path.join(TMP_DIR, file)
      let stat
      try { stat = fs.statSync(filePath) } catch { continue }
      if (stat.isDirectory()) continue

      const age = now - stat.mtimeMs
      if (age > MAX_AGE_MS) {
        try {
          freed += stat.size
          fs.unlinkSync(filePath)
          deleted++
        } catch { }
      }
    }

    if (deleted > 0) {
      const mb = (freed / 1024 / 1024).toFixed(2)
      console.log(`[AutoClean] حذفنا ${deleted} ملف — فرغنا ${mb} MB من /tmp ✅`)

      // إشعار للأونر
      if (notify) {
        try {
          const msg =
`🧹 *AutoClean — تنظيف تلقائي*

✅ تم حذف *${deleted}* ملف من */tmp*
💾 المساحة المحررة: *${mb} MB*
🕐 الوقت: ${new Date().toLocaleTimeString('ar')}`

          global.conn?.sendMessage(OWNER_JID, { text: msg })
        } catch { }
      }
    }
  } catch (e) {
    console.error('[AutoClean] خطأ:', e.message)
  }
}

// ── شغّل مباشرة عند التحميل (بدون إشعار) ────────────
cleanTmp(false)

// ── ثم كل 30 دقيقة مع إشعار للأونر ──────────────────
setInterval(() => cleanTmp(true), INTERVAL_MS)

// ── هاد البلاغين مخفي من المينو ──────────────────────
let handler = async () => {}
handler.help     = []
handler.command  = []
handler.tags     = []
handler.disabled = true

export default handler
