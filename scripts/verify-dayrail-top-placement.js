const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 9410;
const artifactDir = '/Users/roosstudiox/.gemini/antigravity/brain/79603c97-561b-4418-9da7-26c0f84fdbe6';
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function getJson(url) {
  return new Promise((res, rej) => {
    http.get(url, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(JSON.parse(d)));
    }).on('error', rej);
  });
}

function send(ws, method, params = {}) {
  return new Promise((res, rej) => {
    const id = Math.floor(Math.random() * 10000000);
    const handler = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          res(msg);
        }
      } catch (e) {}
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function main() {
  const chrome = spawn(chromePath, [
    '--headless',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=/tmp/roos-dayrail-top-' + Date.now(),
    'about:blank'
  ]);

  let pages = null;
  for (let i = 0; i < 30; i++) {
    try {
      await new Promise(r => setTimeout(r, 400));
      pages = await getJson(`http://127.0.0.1:${port}/json/list`);
      if (pages && pages.length > 0) break;
    } catch (e) {}
  }

  const pageTarget = pages.find(p => p.type === 'page') || pages[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));

  await send(ws, 'Page.enable');
  await send(ws, 'Runtime.enable');
  await send(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 2,
    mobile: false
  });

  await send(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise(r => setTimeout(r, 4000));

  // 1. Capture Row 2 (Priority Action + The Day Rail side by side)
  const row2Rect = await send(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const h2 = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('Priority Action'));
        const card1 = h2 ? h2.closest('.card') : null;
        const row2 = card1 ? card1.parentElement : null;
        if (!row2) return null;
        const r = row2.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      })()
    `,
    returnByValue: true
  });

  console.log('Row 2 Rect:', row2Rect.result.result.value);
  const r2 = row2Rect.result.result.value;

  if (r2) {
    const snapRow2 = await send(ws, 'Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: Math.max(0, r2.x - 10),
        y: Math.max(0, r2.y - 10),
        width: r2.width + 20,
        height: r2.height + 20,
        scale: 2
      }
    });
    fs.writeFileSync(path.join(artifactDir, 'dayrail-top-placement-row2.png'), Buffer.from(snapRow2.result.data, 'base64'));
    console.log('Saved dayrail-top-placement-row2.png');
  }

  // 2. Capture Full Viewport showing Row 1, Row 2, Row 3
  const snapFull = await send(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'overview-dayrail-top-viewport.png'), Buffer.from(snapFull.result.data, 'base64'));
  console.log('Saved overview-dayrail-top-viewport.png');

  chrome.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
