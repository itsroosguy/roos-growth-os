const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9560;
const baseUrl = 'http://localhost:3000/app/acme-corp/subscription';
const artifactDir = '/Users/roosstudiox/.gemini/antigravity/brain/79603c97-561b-4418-9da7-26c0f84fdbe6';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

function sendCommand(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
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
  console.log('--- CAPTURING SUBSCRIPTION PAGE ---');
  const chrome = spawn(chromePath, [
    '--headless',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=/tmp/roos-sub-profile-' + Date.now(),
    'about:blank',
  ]);

  try {
    let pages = null;
    for (let i = 0; i < 30; i++) {
      try {
        await sleep(300);
        pages = await getJson(`http://127.0.0.1:${port}/json/list`);
        if (pages && pages.length > 0) break;
      } catch (e) {}
    }
    if (!pages || pages.length === 0)
      throw new Error('Could not connect to Chrome on port ' + port);

    const pageTarget = pages.find((p) => p.type === 'page') || pages[0];
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve);
      ws.addEventListener('error', reject);
    });

    await sendCommand(ws, 'Page.enable');
    await sendCommand(ws, 'DOM.enable');
    await sendCommand(ws, 'Runtime.enable');

    await sendCommand(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 1200,
      deviceScaleFactor: 2,
      mobile: false,
    });

    console.log('Navigating to ' + baseUrl);
    await sendCommand(ws, 'Page.navigate', { url: baseUrl });

    // Wait until subscription page is loaded
    let ready = false;
    for (let i = 0; i < 40; i++) {
      const check = await sendCommand(ws, 'Runtime.evaluate', {
        expression: 'document.body.innerText.includes("Subscription & Usage") || document.body.innerText.includes("Current Plan")',
      });
      if (check && check.result && check.result.value) {
        ready = true;
        break;
      }
      await sleep(250);
    }
    console.log('Page ready:', ready);
    await sleep(2000);

    const screenshot = await sendCommand(ws, 'Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
    });

    const fullPath = path.join(artifactDir, 'subscription-page-proof.png');
    fs.writeFileSync(fullPath, Buffer.from(screenshot.data, 'base64'));
    console.log('Saved subscription page screenshot to:', fullPath);

    ws.close();
  } finally {
    chrome.kill('SIGKILL');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
