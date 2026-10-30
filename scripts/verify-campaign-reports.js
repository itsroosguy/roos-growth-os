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
      r.on('end', () => {
        try {
          res(JSON.parse(d));
        } catch (e) {
          rej(e);
        }
      });
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
    '--user-data-dir=/tmp/roos-camp-' + Date.now(),
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

  if (!pages || pages.length === 0) {
    throw new Error("Could not connect to Chrome on port " + port);
  }

  const pageTarget = pages.find(p => p.type === 'page') || pages[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));

  await send(ws, 'Page.enable');
  await send(ws, 'Runtime.enable');
  await send(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 2,
    mobile: false
  });

  // 1. Campaigns List (Table View)
  console.log("Capturing 1: Campaigns Table View...");
  await send(ws, 'Page.navigate', { url: 'http://localhost:3000/app/acme-corp/campaigns' });
  await new Promise(r => setTimeout(r, 3500));

  let snap = await send(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'campaigns-table-view.png'), Buffer.from(snap.result.data, 'base64'));
  console.log("Saved campaigns-table-view.png");

  // 2. Switch to Chart View on /campaigns
  console.log("Capturing 2: Campaigns Chart View...");
  await send(ws, 'Runtime.evaluate', {
    expression: `
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Chart View'))?.click();
    `
  });
  await new Promise(r => setTimeout(r, 1200));

  snap = await send(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'campaigns-chart-view.png'), Buffer.from(snap.result.data, 'base64'));
  console.log("Saved campaigns-chart-view.png");

  // 3. Campaign Detail Report (Chart View)
  console.log("Capturing 3: Campaign Detail Chart View...");
  await send(ws, 'Page.navigate', { url: 'http://localhost:3000/app/acme-corp/campaigns/camp-101' });
  await new Promise(r => setTimeout(r, 3500));

  snap = await send(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'campaign-detail-chart-view.png'), Buffer.from(snap.result.data, 'base64'));
  console.log("Saved campaign-detail-chart-view.png");

  // 4. Switch to Recipient Table on /camp-101
  console.log("Capturing 4: Campaign Detail Table View...");
  await send(ws, 'Runtime.evaluate', {
    expression: `
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Recipient Table'))?.click();
    `
  });
  await new Promise(r => setTimeout(r, 1200));

  snap = await send(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'campaign-detail-table-view.png'), Buffer.from(snap.result.data, 'base64'));
  console.log("Saved campaign-detail-table-view.png");

  // 5. Open New Campaign Wizard to Step 2
  console.log("Capturing 5: Campaign Wizard Demographic Filters...");
  await send(ws, 'Page.navigate', { url: 'http://localhost:3000/app/acme-corp/campaigns' });
  await new Promise(r => setTimeout(r, 2000));

  await send(ws, 'Runtime.evaluate', {
    expression: `
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('New Campaign'))?.click();
    `
  });
  await new Promise(r => setTimeout(r, 1000));

  // Type campaign name and click Continue to reach Step 2
  await send(ws, 'Runtime.evaluate', {
    expression: `
      const nameInput = document.querySelector('input[placeholder*="Retail Software"]');
      if (nameInput) {
        nameInput.value = "Q1 Client Retargeting Campaign";
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    `
  });
  await new Promise(r => setTimeout(r, 600));

  await send(ws, 'Runtime.evaluate', {
    expression: `
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continue'))?.click();
    `
  });
  await new Promise(r => setTimeout(r, 1200));

  snap = await send(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'campaign-wizard-demographic-filters.png'), Buffer.from(snap.result.data, 'base64'));
  console.log("Saved campaign-wizard-demographic-filters.png");

  chrome.kill();
  console.log("Finished all screenshots!");
  process.exit(0);
}

main().catch(err => {
  console.error("Verification error:", err);
  process.exit(1);
});
