//plugin by noureddine ouafy
// scrape by Claude ai
import { spawn }   from 'child_process';
import { writeFile, unlink, mkdtemp } from 'fs/promises';
import { tmpdir }  from 'os';
import { join }    from 'path';

// ═══════════════════════════════════════════════════════════════════════════
//  PYTHON SCRIPT content (written to a temp file at runtime)
// ═══════════════════════════════════════════════════════════════════════════
const PY_CODE = `
import sys, struct, zlib, base64, io

def img_to_pdf(img_bytes, page_size):
    # ── Detect format ──────────────────────────────────────────────
    if img_bytes[:2] == b'\\xff\\xd8':
        fmt = 'jpeg'
    elif img_bytes[:8] == b'\\x89PNG\\r\\n\\x1a\\n':
        fmt = 'png'
    else:
        sys.stderr.write('ERR:unsupported_format\\n')
        sys.exit(1)

    # ── Read dimensions & prepare raw image data ───────────────────
    if fmt == 'jpeg':
        i, w, h = 2, 0, 0
        while i < len(img_bytes) - 9:
            if img_bytes[i] != 0xFF: break
            m = img_bytes[i+1]
            if m in (0xC0, 0xC1, 0xC2):
                h = struct.unpack('>H', img_bytes[i+5:i+7])[0]
                w = struct.unpack('>H', img_bytes[i+7:i+9])[0]
                break
            seg_len = struct.unpack('>H', img_bytes[i+2:i+4])[0]
            i += 2 + seg_len
        if not w or not h:
            sys.stderr.write('ERR:jpeg_dimensions\\n')
            sys.exit(1)
        raw_img    = img_bytes
        img_filter = 'DCTDecode'

    else:  # PNG
        w   = struct.unpack('>I', img_bytes[16:20])[0]
        h   = struct.unpack('>I', img_bytes[20:24])[0]
        ct  = img_bytes[25]          # color type
        bpp = 4 if ct == 6 else 3   # RGBA=4, RGB=3

        idat, pos = b'', 8
        while pos < len(img_bytes):
            length = struct.unpack('>I', img_bytes[pos:pos+4])[0]
            ctype  = img_bytes[pos+4:pos+8]
            data   = img_bytes[pos+8:pos+8+length]
            if ctype == b'IDAT': idat += data
            pos += 12 + length

        raw    = zlib.decompress(idat)
        stride = w * bpp
        pixels = bytearray()

        for row in range(h):
            f    = raw[row * (stride+1)]
            line = bytearray(raw[row*(stride+1)+1:(row+1)*(stride+1)])
            prev = bytearray(pixels[-stride:]) if row > 0 else bytearray(stride)
            if f == 0:
                pixels += line
            elif f == 1:
                for x in range(bpp, len(line)): line[x] = (line[x]+line[x-bpp])&0xFF
                pixels += line
            elif f == 2:
                for x in range(len(line)): line[x] = (line[x]+prev[x])&0xFF
                pixels += line
            elif f == 3:
                for x in range(len(line)):
                    a = line[x-bpp] if x>=bpp else 0
                    line[x] = (line[x]+(a+prev[x])//2)&0xFF
                pixels += line
            elif f == 4:
                for x in range(len(line)):
                    a  = line[x-bpp] if x>=bpp else 0
                    b2 = prev[x]; c = prev[x-bpp] if x>=bpp else 0
                    p  = a+b2-c; pa,pb2,pc = abs(p-a),abs(p-b2),abs(p-c)
                    pr = a if pa<=pb2 and pa<=pc else (b2 if pb2<=pc else c)
                    line[x] = (line[x]+pr)&0xFF
                pixels += line
            else:
                pixels += line

        if bpp == 4:  # strip alpha
            rgb = bytearray()
            for i in range(0, len(pixels), 4): rgb += pixels[i:i+3]
            pixels = rgb

        raw_img    = zlib.compress(bytes(pixels))
        img_filter = 'FlateDecode'

    # ── Page layout ─────────────────────────────────────────────────
    sizes = {'a4':(595,842), 'a3':(842,1191), 'letter':(612,792)}
    if page_size in sizes:
        pw, ph = sizes[page_size]
        if w > h and pw < ph: pw, ph = ph, pw
        scale       = min(pw/w, ph/h)
        dw, dh      = w*scale, h*scale
        dx, dy      = (pw-dw)/2, (ph-dh)/2
    else:
        pw, ph      = float(w), float(h)
        dw, dh, dx, dy = pw, ph, 0.0, 0.0

    # ── Build PDF from scratch ───────────────────────────────────────
    buf     = bytearray()
    offsets = {}

    def add_obj(oid, data):
        offsets[oid] = len(buf)
        buf.extend(f'{oid} 0 obj\\n'.encode())
        buf.extend(data if isinstance(data,(bytes,bytearray)) else data.encode())
        buf.extend(b'\\nendobj\\n')

    buf.extend(b'%PDF-1.4\\n%\\xe2\\xe3\\xcf\\xd3\\n')
    add_obj(1, '<< /Type /Catalog /Pages 2 0 R >>')
    add_obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
    add_obj(3, (
        f'<< /Type /Page /Parent 2 0 R '
        f'/MediaBox [0 0 {pw:.2f} {ph:.2f}] '
        f'/Contents 5 0 R '
        f'/Resources << /XObject << /Im0 4 0 R >> >> >>'
    ))

    # Image XObject (obj 4)
    img_hdr = (
        f'<< /Type /XObject /Subtype /Image '
        f'/Width {w} /Height {h} '
        f'/ColorSpace /DeviceRGB /BitsPerComponent 8 '
        f'/Filter /{img_filter} /Length {len(raw_img)} >>\\n'
        f'stream\\n'
    ).encode()
    offsets[4] = len(buf)
    buf.extend(b'4 0 obj\\n' + img_hdr + raw_img + b'\\nendstream\\nendobj\\n')

    # Content stream (obj 5)
    content = f'q {dw:.4f} 0 0 {dh:.4f} {dx:.4f} {dy:.4f} cm /Im0 Do Q'.encode()
    add_obj(5, f'<< /Length {len(content)} >>\\nstream\\n'.encode() + content + b'\\nendstream')

    # xref + trailer
    xref_pos = len(buf)
    buf.extend(b'xref\\n0 6\\n0000000000 65535 f \\n')
    for i in range(1,6):
        buf.extend(f'{offsets[i]:010d} 00000 n \\n'.encode())
    buf.extend(f'trailer\\n<< /Size 6 /Root 1 0 R >>\\nstartxref\\n{xref_pos}\\n%%%%EOF'.encode())

    sys.stdout.buffer.write(base64.b64encode(bytes(buf)))

page_size = sys.argv[1] if len(sys.argv)>1 else 'fit'
img_bytes = sys.stdin.buffer.read()
img_to_pdf(img_bytes, page_size)
`.trim();

// ═══════════════════════════════════════════════════════════════════════════
//  Run Python: write script to temp file, pass image via stdin
// ═══════════════════════════════════════════════════════════════════════════
async function convertToPdf(imgBuffer, pageSize) {
  // Write Python script to a temp file once per call
  const tmpDir    = await mkdtemp(join(tmpdir(), 'img2pdf-'));
  const scriptPath = join(tmpDir, 'convert.py');
  await writeFile(scriptPath, PY_CODE, 'utf8');

  return new Promise((resolve, reject) => {
    const py = spawn('python3', [scriptPath, pageSize], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const chunks = [];
    const errChunks = [];

    py.stdout.on('data', d => chunks.push(d));
    py.stderr.on('data', d => errChunks.push(d));

    py.on('close', async (code) => {
      // Cleanup temp file
      unlink(scriptPath).catch(() => {});
      unlink(tmpDir).catch(() => {});

      if (code !== 0) {
        const err = Buffer.concat(errChunks).toString().trim();
        if (err.includes('unsupported_format')) return reject(new Error('صيغة غير مدعومة — استعمل JPG أو PNG'));
        return reject(new Error(err || `Python exited with code ${code}`));
      }

      const b64 = Buffer.concat(chunks).toString().trim();
      if (!b64) return reject(new Error('Python returned empty output'));
      resolve(Buffer.from(b64, 'base64'));
    });

    py.on('error', reject);

    // Send image bytes via stdin
    py.stdin.write(imgBuffer);
    py.stdin.end();
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  Detect image type from magic bytes
// ═══════════════════════════════════════════════════════════════════════════
function detectType(buf) {
  if (buf[0] === 0xFF && buf[1] === 0xD8) return 'JPG';
  if (buf[0] === 0x89 && buf[1] === 0x50) return 'PNG';
  if (buf[0] === 0x52 && buf[1] === 0x49) return 'WebP';
  return 'Unknown';
}

// ═══════════════════════════════════════════════════════════════════════════
//  HANDLER
// ═══════════════════════════════════════════════════════════════════════════
let handler = async (m, { conn, text }) => {
  const arg = String(text || '').trim().toLowerCase();

  let pageSize = 'fit';
  if      (arg.includes('a4'))     pageSize = 'a4';
  else if (arg.includes('a3'))     pageSize = 'a3';
  else if (arg.includes('letter')) pageSize = 'letter';

  const isImage = (msg) =>
    msg?.mtype === 'imageMessage' ||
    msg?.mtype === 'viewOnceMessageV2' ||
    msg?.mtype === 'viewOnceMessageV2Extension';

  const imgMsg = isImage(m) ? m : isImage(m.quoted) ? m.quoted : null;

  if (!imgMsg) {
    return m.reply(
`❌ *أرسل صورة مع الأمر أو رد على صورة!*
*Send an image or reply to one!*

📌 *الاستخدام / Usage:*
• أرسل صورة + caption: \`.img2pdf\`
• أو رد على صورة بـ: \`.img2pdf\`

⚙️ *خيارات الصفحة / Page options:*
\`.img2pdf\`        → حجم الصورة / Fit
\`.img2pdf a4\`     → A4
\`.img2pdf a3\`     → A3
\`.img2pdf letter\` → US Letter`
    );
  }

  await m.reply(`⏳ جاري التحويل... / Converting...`);

  let imgBuffer;
  try {
    imgBuffer = Buffer.from(await imgMsg.download());
  } catch (e) {
    return m.reply(`❌ فشل تحميل الصورة:\n${e.message}`);
  }

  const imgType = detectType(imgBuffer);
  if (imgType === 'WebP') {
    return m.reply(
`⚠️ *WebP غير مدعوم.*
الرجاء إرسال الصورة بصيغة JPG أو PNG.
Please send the image as JPG or PNG.`
    );
  }

  let pdfBuffer;
  try {
    pdfBuffer = await convertToPdf(imgBuffer, pageSize);
  } catch (e) {
    return m.reply(`❌ *فشل التحويل / Conversion failed*\n${e.message}`);
  }

  const sizeKB        = (pdfBuffer.length / 1024).toFixed(1);
  const pageSizeLabel = pageSize === 'fit' ? 'Fit to image' : pageSize.toUpperCase();

  try {
    await conn.sendMessage(
      m.chat,
      {
        document: pdfBuffer,
        mimetype: 'application/pdf',
        fileName: 'image-converted.pdf',
        caption:
`✅ *تم التحويل! / Done!*

• *الصيغة / Format:* ${imgType} → PDF
• *الصفحة / Page:* ${pageSizeLabel}
• *الحجم / Size:* ${sizeKB} KB

⚡ Zero dependencies — Pure Python stdlib`
      },
      { quoted: m }
    );
  } catch (e) {
    await m.reply(`❌ فشل الإرسال:\n${e.message}`);
  }
};

handler.help = ['img2pdf'];
handler.tags    = ['tools'];
handler.command = ['img2pdf'];
export default handler;
