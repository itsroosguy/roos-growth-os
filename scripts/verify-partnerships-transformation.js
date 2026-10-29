const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 9415;
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
    '--user-data-dir=/tmp/roos-partnerships-' + Date.now(),
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
    height: 1100,
    deviceScaleFactor: 2,
    mobile: false
  });

  await send(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise(r => setTimeout(r, 4000));

  // 1. Scroll to Partnerships section and capture List View
  const listRect = await send(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const h2 = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('Partnerships in Motion'));
        const card = h2 ? h2.closest('.card') : null;
        if (!card) return null;
        card.scrollIntoView({ behavior: 'instant', block: 'center' });
        const r = card.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      })()
    `,
    returnByValue: true
  });

  await new Promise(r => setTimeout(r, 600));

  // Re-get rect after scroll
  const updatedRect = await send(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const h2 = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('Partnerships in Motion'));
        const card = h2 ? h2.closest('.card') : null;
        if (!card) return null;
        const r = card.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      })()
    `,
    returnByValue: true
  });

  const rList = updatedRect.result.result.value;
  console.log('List Rect:', rList);

  if (rList) {
    const snapList = await send(ws, 'Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: Math.max(0, rList.x - 10),
        y: Math.max(0, rList.y - 10),
        width: rList.width + 20,
        height: rList.height + 20,
        scale: 2
      }
    });
    fs.writeFileSync(path.join(artifactDir, 'partnerships-list-view.png'), Buffer.from(snapList.result.data, 'base64'));
    console.log('Saved partnerships-list-view.png');
  }

  // 2. Click Grid View button and capture Card Grid
  await send(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.querySelector('button[title="Card Grid"]');
        if (btn) btn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 600));

  const updatedGridRect = await send(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const h2 = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('Partnerships in Motion'));
        const card = h2 ? h2.closest('.card') : null;
        if (!card) return null;
        const r = card.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      })()
    `,
    returnByValue: true
  });

  const rGrid = updatedGridRect.result.result.value;
  if (rGrid) {
    const snapGrid = await send(ws, 'Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: Math.max(0, rGrid.x - 10),
        y: Math.max(0, rGrid.y - 10),
        width: rGrid.width + 20,
        height: rGrid.height + 20,
        scale: 2
      }
    });
    fs.writeFileSync(path.join(artifactDir, 'partnerships-card-grid-view.png'), Buffer.from(snapGrid.result.data, 'base64'));
    console.log('Saved partnerships-card-grid-view.png');
  }

  // 3. Switch back to List and click Sneha Reddy / first row to open Drawer
  await send(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.querySelector('button[title="List View"]');
        if (btn) btn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 400));

  await send(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const row = Array.from(document.querySelectorAll('.card .cursor-pointer')).find(el => el.innerText.includes('Fleet Management') || el.innerText.includes('Sneha'));
        if (row) row.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 800));

  const snapDrawer = await send(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'partnerships-drawer-details.png'), Buffer.from(snapDrawer.result.data, 'base64'));
  console.log('Saved partnerships-drawer-details.png');

  chrome.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
