const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9540;
const baseUrl = 'http://localhost:3000/app/acme-corp/overview';
const artifactDir = '/Users/roosstudiox/.gemini/antigravity/brain/79603c97-561b-4418-9da7-26c0f84fdbe6';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
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
  console.log('--- CAPTURING REWORKED ACTION CARD PROOF ---');
  const chrome = spawn(chromePath, [
    '--headless',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=/tmp/roos-action-profile-' + Date.now(),
    'about:blank'
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
    if (!pages || pages.length === 0) throw new Error('Could not connect to Chrome on port ' + port);

    const pageTarget = pages.find(p => p.type === 'page') || pages[0];
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
      height: 1050,
      deviceScaleFactor: 2,
      mobile: false
    });

    console.log('Navigating to overview...');
    await sendCommand(ws, 'Page.navigate', { url: baseUrl });

    // Wait until Action required heading is present
    let ready = false;
    for (let i = 0; i < 30; i++) {
      const check = await sendCommand(ws, 'Runtime.evaluate', {
        expression: '!!document.querySelector("h3") && Array.from(document.querySelectorAll("h3")).some(el => el.innerText.includes("Action required"))'
      });
      if (check && check.result && check.result.value) {
        ready = true;
        break;
      }
      await sleep(300);
    }
    if (!ready) console.warn('Warning: Action required heading not confirmed');
    await sleep(2000);

    // 1. Get exact bounding rect of the card
    const cardClip = await sendCommand(ws, 'Runtime.evaluate', {
      expression: `(() => {
        const h3 = Array.from(document.querySelectorAll("h3")).find(el => el.innerText.includes("Action required"));
        if (!h3) return null;
        let card = h3.closest('.card-ref');
        if (!card) card = h3.parentElement.parentElement.parentElement;
        const rect = card.getBoundingClientRect();
        return {
          x: Math.max(0, rect.x - 4),
          y: Math.max(0, rect.y - 4),
          width: rect.width + 8,
          height: rect.height + 16,
          scale: 1
        };
      })()`,
      returnByValue: true
    });

    console.log('Card bounding rect:', cardClip.result.value);

    // Capture cropped card
    if (cardClip.result.value) {
      const cardShot = await sendCommand(ws, 'Page.captureScreenshot', {
        format: 'png',
        clip: cardClip.result.value
      });
      const cardPath = path.join(artifactDir, 'action-required-reworked.png');
      fs.writeFileSync(cardPath, Buffer.from(cardShot.data, 'base64'));
      console.log('✓ Cropped action card screenshot saved: action-required-reworked.png');
    }

    // Capture full 1440 overview
    const fullShot = await sendCommand(ws, 'Page.captureScreenshot', { format: 'png' });
    const fullPath = path.join(artifactDir, 'overview-action-section-full.png');
    fs.writeFileSync(fullPath, Buffer.from(fullShot.data, 'base64'));
    console.log('✓ Full overview screenshot saved: overview-action-section-full.png');

    console.log('--- CAPTURE COMPLETE ---');
    ws.close();
  } finally {
    chrome.kill();
  }
}

main().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
