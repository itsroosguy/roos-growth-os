const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 9288;
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
  console.log('Launching headless Chrome on port', port);
  const chrome = spawn(chromePath, [
    '--headless',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=/tmp/roos-row1-align-' + Date.now(),
    'about:blank'
  ]);

  let pages = null;
  for (let i = 0; i < 40; i++) {
    try {
      await new Promise(r => setTimeout(r, 600));
      pages = await getJson(`http://127.0.0.1:${port}/json/list`);
      if (pages && pages.length > 0) break;
    } catch (e) {}
  }

  if (!pages || pages.length === 0) {
    chrome.kill();
    throw new Error('Chrome did not initialize on port ' + port);
  }

  const pageTarget = pages.find(p => p.type === 'page') || pages[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));

  await send(ws, 'Page.enable');
  await send(ws, 'Runtime.enable');
  await send(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 960,
    deviceScaleFactor: 2,
    mobile: false
  });

  console.log('Navigating to http://localhost:3000/ ...');
  await send(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise(r => setTimeout(r, 4000));

  // Inspect Row 1 collapsed
  const collapsedMetrics = await send(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        // Find left 2x2 grid by looking for button with "Waiting on you"
        const allButtons = Array.from(document.querySelectorAll('button'));
        const waitingBtn = allButtons.find(b => b.innerText.includes('Waiting on you'));
        if (!waitingBtn) return { error: 'Waiting on you button not found' };

        const leftGrid = waitingBtn.parentElement;
        const leftRect = leftGrid.getBoundingClientRect();

        // 4 chips
        const dueBtn = allButtons.find(b => b.innerText.includes('Due today'));
        const overdueElem = allButtons.find(b => b.innerText.includes('Overdue')) ||
          Array.from(document.querySelectorAll('div')).find(d => d.innerText.includes('Overdue') && d.innerText.includes('On track'));
        const proposalBtn = allButtons.find(b => b.innerText.includes('In proposal'));

        const wRect = waitingBtn.getBoundingClientRect();
        const dRect = dueBtn ? dueBtn.getBoundingClientRect() : null;
        const oRect = overdueElem ? overdueElem.getBoundingClientRect() : null;
        const pRect = proposalBtn ? proposalBtn.getBoundingClientRect() : null;

        const rowGap = oRect ? (oRect.top - wRect.bottom) : null;

        // Recent Activity Card
        const h2 = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('Recent activity'));
        const actCard = h2 ? h2.closest('.rounded-\\[16px\\]') || h2.closest('.rounded-\\[20px\\]') || h2.parentElement.parentElement.parentElement.parentElement : null;
        const actRect = actCard ? actCard.getBoundingClientRect() : null;

        return {
          leftGrid: {
            top: leftRect.top,
            bottom: leftRect.bottom,
            height: leftRect.height,
            width: leftRect.width
          },
          waitingChip: { height: wRect.height },
          overdueChip: oRect ? { height: oRect.height } : null,
          chipRowGap: rowGap,
          recentActivityCard: actRect ? {
            top: actRect.top,
            bottom: actRect.bottom,
            height: actRect.height,
            width: actRect.width
          } : null,
          heightDifference: actRect ? Math.abs(leftRect.height - actRect.height) : null
        };
      })()
    `,
    returnByValue: true
  });

  console.log('--- COLLAPSED STATE METRICS ---');
  console.log(JSON.stringify(collapsedMetrics.result.value, null, 2));

  // Take screenshot of collapsed state (Row 1 focused)
  const snapCollapsed = await send(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'row1-alignment-collapsed.png'), Buffer.from(snapCollapsed.data, 'base64'));
  console.log('Saved row1-alignment-collapsed.png');

  // Now click "Expand" button on Recent Activity
  console.log('Clicking Expand button...');
  await send(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const allButtons = Array.from(document.querySelectorAll('button'));
        const expandBtn = allButtons.find(b => b.innerText.includes('Expand'));
        if (expandBtn) {
          expandBtn.click();
          return true;
        }
        return false;
      })()
    `
  });

  await new Promise(r => setTimeout(r, 600));

  // Inspect Row 1 expanded
  const expandedMetrics = await send(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const allButtons = Array.from(document.querySelectorAll('button'));
        const waitingBtn = allButtons.find(b => b.innerText.includes('Waiting on you'));
        if (!waitingBtn) return { error: 'Waiting on you button not found' };

        const leftGrid = waitingBtn.parentElement;
        const leftRect = leftGrid.getBoundingClientRect();

        const overdueElem = allButtons.find(b => b.innerText.includes('Overdue')) ||
          Array.from(document.querySelectorAll('div')).find(d => d.innerText.includes('Overdue') && d.innerText.includes('On track'));

        const wRect = waitingBtn.getBoundingClientRect();
        const oRect = overdueElem ? overdueElem.getBoundingClientRect() : null;
        const rowGap = oRect ? (oRect.top - wRect.bottom) : null;

        const h2 = Array.from(document.querySelectorAll('h2')).find(h => h.innerText.includes('Recent activity'));
        const actCard = h2 ? h2.closest('.rounded-\\[16px\\]') || h2.closest('.rounded-\\[20px\\]') || h2.parentElement.parentElement.parentElement.parentElement : null;
        const actRect = actCard ? actCard.getBoundingClientRect() : null;

        return {
          leftGrid: {
            height: leftRect.height,
            width: leftRect.width
          },
          chipRowGap: rowGap,
          recentActivityCard: actRect ? {
            height: actRect.height,
            width: actRect.width
          } : null
        };
      })()
    `,
    returnByValue: true
  });

  console.log('--- EXPANDED STATE METRICS ---');
  console.log(JSON.stringify(expandedMetrics.result.value, null, 2));

  // Take screenshot of expanded state
  const snapExpanded = await send(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'row1-alignment-expanded.png'), Buffer.from(snapExpanded.data, 'base64'));
  console.log('Saved row1-alignment-expanded.png');

  chrome.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
