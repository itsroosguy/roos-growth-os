const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9235;
const baseUrl = 'http://localhost:3000/app/acme-corp/overview';
const artifactDir = '/Users/roosstudiox/.gemini/antigravity/brain/79603c97-561b-4418-9da7-26c0f84fdbe6';

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function sendCommand(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 10000000);
    const handler = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
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
    '--user-data-dir=/tmp/roos-crop-profile-' + Date.now(),
    'about:blank'
  ]);

  let pages = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      await new Promise(r => setTimeout(r, 600));
      pages = await getJson(`http://127.0.0.1:${port}/json/list`);
      if (pages && pages.length > 0) break;
    } catch (e) {}
  }

  const pageTarget = pages.find(p => p.type === 'page') || pages[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });

  await sendCommand(ws, 'Page.enable');
  await sendCommand(ws, 'Runtime.enable');

  await sendCommand(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false,
  });

  await sendCommand(ws, 'Page.navigate', { url: baseUrl });
  await new Promise(r => setTimeout(r, 2000));

  // 1. Capture Expanded Sidebar Header
  const expCrop = await sendCommand(ws, 'Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: 300, height: 120, scale: 1 }
  });
  fs.writeFileSync(path.join(artifactDir, 'sidebar-header-expanded.png'), Buffer.from(expCrop.data, 'base64'));
  console.log('Saved sidebar-header-expanded.png');

  // 2. Collapse
  await sendCommand(ws, 'Runtime.evaluate', {
    expression: `document.querySelector('button[aria-label="Collapse sidebar"]').click()`
  });
  await new Promise(r => setTimeout(r, 800));

  // 3. Capture Collapsed Sidebar Header
  const colCrop = await sendCommand(ws, 'Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: 160, height: 120, scale: 1 }
  });
  fs.writeFileSync(path.join(artifactDir, 'sidebar-header-collapsed.png'), Buffer.from(colCrop.data, 'base64'));
  console.log('Saved sidebar-header-collapsed.png');

  chrome.kill();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
