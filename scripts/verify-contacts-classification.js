const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 9450;
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
    '--user-data-dir=/tmp/roos-contacts-' + Date.now(),
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
    height: 950,
    deviceScaleFactor: 2,
    mobile: false
  });

  await send(ws, 'Page.navigate', { url: 'http://localhost:3000/app/acme-corp/contacts' });
  await new Promise(r => setTimeout(r, 3500));

  // 1. Capture Full Table Overview with Tabs, Email column, Department pills & Relationship Status
  const snapOverview = await send(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'contacts-classified-table.png'), Buffer.from(snapOverview.result.data, 'base64'));
  console.log('Saved contacts-classified-table.png');

  // 2. Click Vikram Deshmukh (Ongoing Client / Finance Head) to capture Drawer
  await send(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const row = Array.from(document.querySelectorAll('tr')).find(r => r.innerText.includes('Vikram') || r.innerText.includes('Finance'));
        if (row) row.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 800));

  const snapDrawer = await send(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'contacts-drawer-classified.png'), Buffer.from(snapDrawer.result.data, 'base64'));
  console.log('Saved contacts-drawer-classified.png');

  chrome.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
