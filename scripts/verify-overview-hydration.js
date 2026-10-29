const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const port = 9251;

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
          if (msg.error) rej(new Error(msg.error.message));
          else res(msg.result);
        }
      } catch (e) {}
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function main() {
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=/tmp/roos-clean-profile-' + Date.now(),
    'about:blank'
  ]);

  let pages = null;
  for (let i = 0; i < 20; i++) {
    try {
      await new Promise(r => setTimeout(r, 600));
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
    height: 900,
    deviceScaleFactor: 2,
    mobile: false
  });

  await send(ws, 'Page.navigate', { url: 'http://localhost:3000/app/acme-corp/overview' });
  await new Promise(r => setTimeout(r, 2500));

  const check = await send(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const nextErr = document.querySelector('nextjs-portal');
        const errToast = document.querySelector('.nextjs-toast-errors-parent');
        const shadowErr = nextErr && nextErr.shadowRoot ? nextErr.shadowRoot.querySelector('[data-nextjs-dialog-overlay]') : null;
        return {
          hasPortal: !!nextErr,
          hasToast: !!errToast,
          hasShadowErr: !!shadowErr,
          bodyTextPrefix: document.body.innerText.substring(0, 100)
        };
      })()
    `,
    returnByValue: true
  });

  console.log('HYDRATION CHECK RESULT:', JSON.stringify(check.result.value, null, 2));

  // Also capture the screenshot to verify visually that zero red error toast is present in bottom-left
  const snap = await send(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('/Users/roosstudiox/.gemini/antigravity/brain/79603c97-561b-4418-9da7-26c0f84fdbe6/overview-clean-no-error.png', Buffer.from(snap.data, 'base64'));
  console.log('Saved overview-clean-no-error.png');

  chrome.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
