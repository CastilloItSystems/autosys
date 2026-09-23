// Captura de página completa con emulación real de dispositivo (Chrome DevTools Protocol).
// Uso: node .impeccable/captura.mjs <ancho> <alto-visible> <movil:0|1> <salida.png>
import { spawn } from 'node:child_process'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const [ancho, alto, movil, salida] = [Number(process.argv[2]), Number(process.argv[3]), process.argv[4] === '1', process.argv[5]]
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PUERTO = 9300 + Math.floor(Math.random() * 400)
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${PUERTO}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cdp-'))}`, 'about:blank'], { stdio: 'ignore' })
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
try {
  let ws
  for (let i = 0; i < 50 && !ws; i++) {
    try {
      const tabs = await (await fetch(`http://127.0.0.1:${PUERTO}/json`)).json()
      const t = tabs.find((x) => x.type === 'page')
      if (t) ws = new WebSocket(t.webSocketDebuggerUrl)
    } catch { await esperar(150) }
  }
  await new Promise((r) => ws.addEventListener('open', r, { once: true }))
  let id = 0; const pend = new Map()
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id) } })
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
  await cmd('Page.enable')
  await cmd('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: 1, mobile: movil })
  await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  if (movil) await cmd('Emulation.setTouchEmulationEnabled', { enabled: true })
  await cmd('Page.navigate', { url: 'http://localhost:3100/' })
  await esperar(2500)
  const { cssContentSize } = await cmd('Page.getLayoutMetrics')
  const altoTotal = Math.ceil(cssContentSize.height)
  const r = await cmd('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: ancho, height: altoTotal, scale: 1 } })
  writeFileSync(salida, Buffer.from(r.data, 'base64'))
  console.log(`${salida}: ${ancho}x${altoTotal}`)
  ws.close()
} finally { chrome.kill('SIGKILL') }
