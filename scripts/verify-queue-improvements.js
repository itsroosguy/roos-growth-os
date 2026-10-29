const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 9395;
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
    '--user-data-dir=/tmp/roos-queue-' + Date.now(),
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
    height: 1200,
    deviceScaleFactor: 2,
    mobile: false
  });

  await send(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise(r => setTimeout(r, 4000));

  // Find bounding rect of "Up next in your queue" card
  const queueRect = await send(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const h2 = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('Up next in your queue'));
        const card = h2 ? h2.closest('.card') : null;
        if (!card) return null;
        const r = card.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      })()
    `,
    returnByValue: true
  });

  console.log('Queue Rect Default:', queueRect.result.result.value);
  const r = queueRect.result.result.value;

  if (r) {
    const snapDefault = await send(ws, 'Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: Math.max(0, r.x - 10),
        y: Math.max(0, r.y - 10),
        width: r.width + 20,
        height: r.height + 20,
        scale: 2
      }
    });
    fs.writeFileSync(path.join(artifactDir, 'up-next-queue-improved.png'), Buffer.from(snapDefault.result.data, 'base64'));
    console.log('Saved up-next-queue-improved.png');
  }

  // Click "Reply" on the first item (Aarav Patel)
  console.log('Clicking Reply on first queue item...');
  await send(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const replyBtn = btns.find(b => b.innerText.trim() === 'Reply');
        if (replyBtn) {
          replyBtn.click();
          return true;
        }
        return false;
      })()
    `
  });

  await new Promise(r => setTimeout(r, 600));

  // Capture expanded state
  const queueRectExpanded = await send(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const h2 = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('Up next in your queue'));
        const card = h2 ? h2.closest('.card') : null;
        if (!card) return null;
        const r = card.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      })()
    `,
    returnByValue: true
  });

  console.log('Queue Rect Expanded:', queueRectExpanded.result.result.value);
  const re = queueRectExpanded.result.result.value;

  if (re) {
    const snapExp = await send(ws, 'Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: Math.max(0, re.x - 10),
        y: Math.max(0, re.y - 10),
        width: re.width + 20,
        height: re.height + 20,
        scale: 2
      }
    });
    fs.writeFileSync(path.join(artifactDir, 'up-next-queue-inline-reply.png'), Buffer.from(snapExp.result.data, 'base64'));
    console.log('Saved up-next-queue-inline-reply.png');
  }

  chrome.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
