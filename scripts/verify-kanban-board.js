const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 9440;
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
    '--user-data-dir=/tmp/roos-kanban-' + Date.now(),
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
    width: 1540,
    height: 1000,
    deviceScaleFactor: 2,
    mobile: false
  });

  await send(ws, 'Page.navigate', { url: 'http://localhost:3000/app/acme-corp/leads' });
  await new Promise(r => setTimeout(r, 3500));

  // 1. Capture Full Viewport showing top bar + guidance bar + columns
  const snapOverview = await send(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'kanban-board-elevated.png'), Buffer.from(snapOverview.result.data, 'base64'));
  console.log('Saved kanban-board-elevated.png');

  // 2. Capture Zoom of the first 4 columns
  await send(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const board = document.querySelector('.overflow-x-auto');
        if (board) board.scrollLeft = 0;
      })()
    `
  });
  await new Promise(r => setTimeout(r, 300));

  const zoomRectRes = await send(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const bar = document.querySelector('.overflow-x-auto');
        if (!bar) return null;
        const r = bar.getBoundingClientRect();
        return { x: r.x, y: r.y, width: 1220, height: 680 };
      })()
    `,
    returnByValue: true
  });

  const zr = zoomRectRes.result.result.value;
  if (zr) {
    const snapZoom = await send(ws, 'Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: zr.x,
        y: zr.y,
        width: zr.width,
        height: zr.height,
        scale: 2
      }
    });
    fs.writeFileSync(path.join(artifactDir, 'kanban-card-detail-zoom.png'), Buffer.from(snapZoom.result.data, 'base64'));
    console.log('Saved kanban-card-detail-zoom.png');
  }

  chrome.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
