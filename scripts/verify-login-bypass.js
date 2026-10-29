const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const port = 9253;

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
    '--user-data-dir=/tmp/roos-clean-bypass-' + Date.now(),
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

  // Navigate directly to root '/' without any existing cookies
  console.log('Navigating to root URL: http://localhost:3000/');
  await send(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise(r => setTimeout(r, 3000));

  const check = await send(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const nextErr = document.querySelector('nextjs-portal');
        const errToast = document.querySelector('.nextjs-toast-errors-parent');
        const shadowErr = nextErr && nextErr.shadowRoot ? nextErr.shadowRoot.querySelector('[data-nextjs-dialog-overlay]') : null;
        return {
          currentUrl: window.location.href,
          pathname: window.location.pathname,
          documentTitle: document.title,
          hasPortal: !!nextErr,
          hasToast: !!errToast,
          hasShadowErr: !!shadowErr,
          hasOverviewTitle: document.body.innerText.includes('Good evening') || document.body.innerText.includes('Welcome') || document.body.innerText.includes('Meetings & Calls'),
          cookieHeader: document.cookie
        };
      })()
    `,
    returnByValue: true
  });

  console.log('ROOT NAVIGATION CHECK RESULT:', JSON.stringify(check.result.value, null, 2));

  // Capture screenshot to confirm dashboard loaded perfectly
  const snap = await send(ws, 'Page.captureScreenshot', { format: 'png' });
  const outPath = '/Users/roosstudiox/.gemini/antigravity/brain/79603c97-561b-4418-9da7-26c0f84fdbe6/login-bypassed-direct-overview.png';
  fs.writeFileSync(outPath, Buffer.from(snap.data, 'base64'));
  console.log('Saved screenshot to:', outPath);

  chrome.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
