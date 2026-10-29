const { spawn } = require('child_process');
const http = require('http');

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
    '--user-data-dir=/tmp/roos-error-read-' + Date.now(),
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

  const detailedErrors = [];
  ws.addEventListener('message', evt => {
    try {
      const msg = JSON.parse(evt.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
        if (text.includes('Text content did not match') || text.includes('hydration')) {
          detailedErrors.push({
            args: msg.params.args.map(a => a.value !== undefined ? a.value : a.description)
          });
        }
      }
    } catch (e) {}
  });

  await send(ws, 'Page.enable');
  await send(ws, 'Runtime.enable');
  await send(ws, 'Page.navigate', { url: 'http://localhost:3000/app/acme-corp/overview' });
  await new Promise(r => setTimeout(r, 3000));

  const portalInfo = await send(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const portal = document.querySelector('nextjs-portal');
        if (!portal) return 'No portal found';
        const shadow = portal.shadowRoot;
        if (!shadow) return 'No shadow root';
        return shadow.textContent;
      })()
    `,
    returnByValue: true
  });

  console.log('DETAILED HYDRATION ERRORS:', JSON.stringify(detailedErrors, null, 2));

  chrome.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
