import './function/settings/settings.js'
import { watchFile, unwatchFile } from 'fs'
import fs from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'

// Owner
global.owner = [
['212624854739', 'Noureddine', true]
]
global.mods = []
global.prems = []
global.multiplier = 69
global.rpg = {
  emoticon(string) {
    string = string.toLowerCase();
      let emot = {
      agility: '🤸‍♂️',
      arc: '🏹',
      armor: '🥼',
      bank: '🏦',
      bibitanggur: '🍇',
      bibitapel: '🍎',
      bibitjeruk: '🍊',
      bibitmangga: '🥭',
      bibitpisang: '🍌',
      bow: '🏹',
      bull: '🐃',
      cat: '🐈',
      chicken: '🐓',
      common: '📦',
      cow: '🐄',
      crystal: '🔮',
      darkcrystal: '♠️',
      diamond: '💎',
      dog: '🐕',
      dragon: '🐉',
      elephant: '🐘',
      emerald: '💚',
      exp: '✉️',
      fishingrod: '🎣',
      fox: '🦊',
      gems: '🍀',
      giraffe: '🦒',
      gold: '👑',
      health: '❤️',
      horse: '🐎',
      intelligence: '🧠',
      iron: '⛓️',
      keygold: '🔑',
      keyiron: '🗝️',
      knife: '🔪',
      legendary: '🗃️',
      level: '🧬',
      limit: '🌌',
      lion: '🦁',
      magicwand: '⚕️',
      mana: '🪄',
      money: '💵',
      mythic: '🗳️',
      pet: '🎁',
      petFood: '🍖',
      pickaxe: '⛏️',
      pointxp: '📧',
      potion: '🥤',
      rock: '🪨',
      snake: '🐍',
      stamina: '⚡',
      strength: '🦹‍♀️',
      string: '🕸️',
      superior: '💼',
      sword: '⚔️',
      tiger: '🐅',
      trash: '🗑',
      uncommon: '🎁',
      upgrader: '🧰',
      wood: '🪵'
    }
    let results = Object.keys(emot).map(v => [v, new RegExp(v, 'gi')]).filter(v => v[1].test(string));
    if (!results.length) return '';
    else return emot[results[0][0]];
  }
}

// information 
global.nomerbot = info.nomerbot
global.pairingNumber = info.pairingNumber
global.nomorwa = info.nomorwa
global.nameown = info.nameown
global.nomerown = info.nomerown
global.packname = info.packname
global.author = info.author
global.namebot = info.namebot
global.wm = info.wm
global.stickpack = info.stickpack
global.stickauth = info.stickauth

// Thumbnail 
global.ppKosong = media.ppKosong
global.didyou = media.didyou
global.rulesBot = media.rulesBot
global.thumbnail = media.thumbnail
global.thumb = media.thumb
global.logo = media.logo
global.unReg = media.unReg
global.registrasi = media.registrasi
global.confess = media.confess
global.access = media.access
global.tqto = media.tqto
global.spotify = media.spotify
global.weather = media.weather
global.gempaUrl = media.gempaUrl
global.akses = media.akses
global.wel = media.wel
global.good = media.good

// Social media
global.sig = url.sig
global.sgh = url.sgh
global.sgc = url.sgc

// payment 
global.pdana = payment.pdana
global.wait = msg.wait
global.eror = msg.eror
global.uptime = api.uptime
global.xyro = api.xyro
global.lol = api.lol

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  import(`${file}?update=${Date.now()}`)
})
