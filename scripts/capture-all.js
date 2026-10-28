const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9225;
const baseUrl = 'http://localhost:3000/app/acme-corp';

const mode = process.argv[2] || 'before'; // 'before' or 'after'
const outDir = path.join(__dirname, '..', 'screenshots', mode);

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const viewports = [
  { width: 2560, height: 1440, isMobile: false },
  { width: 1440, height: 900, isMobile: false },
  { width: 1280, height: 800, isMobile: false },
  { width: 1024, height: 768, isMobile: false },
  { width: 768, height: 1024, isMobile: true },
  { width: 390, height: 844, isMobile: true },
];

const routes = [
  { name: 'overview', path: '/overview' },
  { name: 'inbox', path: '/inbox' },
  { name: 'leads', path: '/leads' },
  { name: 'contacts', path: '/contacts' },
  { name: 'campaigns', path: '/campaigns' },
  { name: 'templates', path: '/templates' },
  { name: 'automations', path: '/automations' },
  { name: 'tasks', path: '/tasks' },
  { name: 'reports', path: '/reports' },
  { name: 'team', path: '/team' },
  { name: 'whatsapp', path: '/whatsapp' },
  { name: 'settings-ai', path: '/settings/ai' },
  { name: 'settings-admin', path: '/settings/admin' },
  { name: 'subscription', path: '/subscription' },
  { name: 'settings', path: '/settings' },
];

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
          if (msg.error) {
            reject(new Error(msg.error.message));
          } else {
            resolve(msg.result);
          }
        }
      } catch (e) {}
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function main() {
  console.log(`Starting visual capture [${mode}] -> ${outDir}`);

  const chrome = spawn(chromePath, [
    '--headless',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=/tmp/roos-capture-profile-' + Date.now(),
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

  if (!pages || pages.length === 0) {
    chrome.kill();
    throw new Error('Could not connect to Chrome on port ' + port);
  }

  const pageTarget = pages.find(p => p.type === 'page') || pages[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });

  await sendCommand(ws, 'Page.enable');
  await sendCommand(ws, 'Runtime.enable');

  // Set demo admin cookie
  await sendCommand(ws, 'Runtime.evaluate', {
    expression: `document.cookie = "roos_session=admin; path=/; max-age=86400"`
  });

  let count = 0;
  const total = routes.length * viewports.length;

  for (const r of routes) {
    const targetUrl = `${baseUrl}${r.path}`;
    console.log(`\nCapturing route: ${r.name} (${targetUrl})`);

    for (const vp of viewports) {
      await sendCommand(ws, 'Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.isMobile,
      });

      await sendCommand(ws, 'Page.navigate', { url: targetUrl });
      // Allow Next.js React hydration & layout settlement
      await new Promise(res => setTimeout(res, 1200));

      const snap = await sendCommand(ws, 'Page.captureScreenshot', { format: 'png' });
      const filename = `${r.name}-${vp.width}.png`;
      const filePath = path.join(outDir, filename);
      fs.writeFileSync(filePath, Buffer.from(snap.data, 'base64'));

      count++;
      process.stdout.write(` [${count}/${total}] ${filename}`);
    }
  }

  console.log(`\n\nAll ${count} screenshots successfully written to ${outDir}`);

  try {
    ws.close();
  } catch {}
  chrome.kill();
  process.exit(0);
}

main().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
