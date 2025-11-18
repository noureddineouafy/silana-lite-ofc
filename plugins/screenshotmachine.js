// plugin by noureddine ouafy 
// scrape by wolfyflutter


import fs from "fs"

const ssweb = {
    _static: Object.freeze({
        baseUrl: 'https://www.screenshotmachine.com',
        baseHeaders: {
            'content-encoding': 'zstd'
        },
        taskName: 'ssweb',
        displayLog: false,
        maxOutputLength: 200
    }),

    log(msg) {
        if (this._static.displayLog) console.log(`[${this._static.taskName}] ${msg}`)
    },

    pretyError(str) {
        if (!str) return '(empty message)'
        let message = ''
        try { message = JSON.stringify(str, null, 2) }
        catch { message = str }
        if (message.length >= this._static.maxOutputLength)
            message = message.substring(0, this._static.maxOutputLength) + ' [trimmed]'
        return message
    },

    async getCookie() {
        const r = await fetch(this._static.baseUrl, { headers: this._static.baseHeaders })

        if (!r.ok)
            throw Error(`${r.status} ${r.statusText} at getCookie. ${this.pretyError(await r.text())}`)

        const raw = r.headers.raw()
        const cookies = raw["set-cookie"]

        if (!cookies || !cookies.length) throw Error("Cookie not found")

        const cookie = cookies.map(c => c.split(";")[0]).join("; ")

        return { cookie }
    },

    async req(url, cookie) {
        const headers = {
            cookie,
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            ...this._static.baseHeaders
        }

        const r = await fetch(this._static.baseUrl + "/capture.php", {
            headers,
            method: "POST",
            body: "url=" + encodeURIComponent(url) + "&device=desktop&cacheLimit=0",
        })

        if (!r.ok)
            throw Error(`${r.status} ${r.statusText} at req. ${this.pretyError(await r.text())}`)

        return { reqObj: await r.json() }
    },

    async getBuffer(reqObj, cookie) {
        if (reqObj.status !== "success")
            throw Error("API returned non-success status")

        const api = this._static.baseUrl + "/" + reqObj.link

        const r = await fetch(api, { headers: { cookie } })

        if (!r.ok)
            throw Error(`${r.status} ${r.statusText} at getBuffer. ${this.pretyError(await r.text())}`)

        const arrayBuf = await r.arrayBuffer()
        return { buffer: Buffer.from(arrayBuf) }
    },

    async capture(url) {
        if (!url) throw Error("URL is required")
        const { cookie } = await this.getCookie()
        const { reqObj } = await this.req(url, cookie)
        const { buffer } = await this.getBuffer(reqObj, cookie)
        return buffer
    }
}


// ===============================
//   🔥 Silana Handler
// ===============================

let handler = async (m, { conn, args }) => {
    if (!args[0])
        return m.reply("⚠️ Please insert a valid URL.\nExample: .screenshotmachine https://google.com")

    try {
        m.reply("⏳ Generating screenshot...\nPlease wait!")

        const buffer = await ssweb.capture(args[0])

        await conn.sendMessage(m.chat, {
            image: buffer,
            caption: "🖼 ScreenshotMachine Result"
        }, { quoted: m })

    } catch (e) {
        m.reply("❌ Failed!\n" + e.message)
    }
}

handler.help = handler.command = ['screenshotmachine']
handler.tags = ['tools']
handler.limit = true

export default handler
