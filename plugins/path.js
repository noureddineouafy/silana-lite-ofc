// plugin by midsoune
// thanks
// noureddine ouafy 

import { spawn } from 'child_process';
import fs from 'fs'
import syntaxError from 'syntax-error'
import path from 'path'
const _fs = fs.promises

let midsoune = async (m, { text, usedPrefix, command, __dirname }) => {
  if (!text) throw `
  ✳️ Usage: ${usedPrefix + command} <filename>

  📌 Example:
       ${usedPrefix}getf main.js
       ${usedPrefix}getp owner-info.js 
       ${usedPrefix}path lib
       ${usedPrefix}npm axios
       ${usedPrefix}unpm axios
  `.trim()
  try {
    if (command === 'npm' || command === 'unpm') {
      let cmd;
      if (command === 'npm') {
        cmd = 'npm install ' + text.toLowerCase() + ' --save';
      } else if (command === 'unpm') {
        cmd = 'npm uninstall ' + text.toLowerCase();
      }
      let npmProcess = spawn(cmd, { shell: true });
      npmProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
      });
      npmProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });
      npmProcess.on('close', (code) => {
        if (code === 0) {
          m.react(done);
        } else {
          m.react(error);
        }
      })
    }
    else if (command === 'getf') {
      const pathFile = path.join('./' + text)
      const file = await _fs.readFile(pathFile, 'utf8')
      m.reply(file)
      const error = syntaxError(file, filename, {
        sourceType: 'module',
        allowReturnOutsideFunction: true,
        allowAwaitOutsideFunction: true
      })
      if (error) {
        await m.reply(`
❎ Error in file *${filename}*:

${error}`.trim())
      }
    }
    else if (command === 'getp') {
      const filename = text.replace(/plugin(s)\//i, '') + (/\.js$/i.test(text) ? '' : '.js')
      const pathFile = path.join(__dirname, '../plugins/', filename)
      const file = await _fs.readFile(pathFile, 'utf8')
      console.log(pathFile + ' - ' + filename)
      m.reply(file)

      const error = syntaxError(file, filename, {
        sourceType: 'module',
        allowReturnOutsideFunction: true,
        allowAwaitOutsideFunction: true
      })
      if (error) {
        await m.reply(`
❎ Error in file *${filename}*:

${error}`.trim())
      }
    }
    else if (command === 'path') {
      const files = await _fs.readdir('./' + text)
      const fileList = files.map(file => '📁 ' + file).join('\n')
      await m.reply(`
🗃️ BOBIZA/${text}

${fileList}`.trim())
    } 
    else {
      const isJavascript = /\.js/.test(text)
      if (isJavascript) {
        const file = await _fs.readFile(text, 'utf8')
        m.reply(file)
        const error = syntaxError(file, text, {
          sourceType: 'module',
          allowReturnOutsideFunction: true,
          allowAwaitOutsideFunction: true
        })
        if (error) {
          await m.reply(`
❎ Error found in: *${text}*:

${error}

`.trim())
        }
      } else {
        const file = await _fs.readFile(text, 'base64')
        await m.reply(Buffer.from(file, 'base64'))
      }
    }
  } catch (e) {
    console.error(e)
  }
}

midsoune.command = /^getf|path$/i
midsoune.tags = ["owner"];
midsoune.help = ["path","getf"];
midsoune.rowner = true
export default midsoune
