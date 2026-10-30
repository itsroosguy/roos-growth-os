const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9552;
const baseUrl = 'http://localhost:3000/app/acme-corp/overview';
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
  console.log('--- VERIFYING OVERVIEW REWORK & CAPTURING VISUAL PROOF ---');
  const chrome = spawn(chromePath, [
    '--headless',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=/tmp/roos-ov-profile-' + Date.now(),
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

    // Wait until overview is loaded
    let ready = false;
    for (let i = 0; i < 40; i++) {
      const check = await sendCommand(ws, 'Runtime.evaluate', {
        expression: 'document.body.innerText.includes("has waited") && document.body.innerText.includes("Action required")',
      });
      if (check && check.result && check.result.value) {
        ready = true;
        break;
      }
      await sleep(300);
    }
    console.log('Page ready state:', ready);

    await sleep(3000); // let styles & animations settle

    // Audit computed styles and element checks
    const auditRes = await sendCommand(ws, 'Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const greetingEl = Array.from(document.querySelectorAll('h2')).find(el => el.innerText.includes('Praveen'));
        const greetingStyle = greetingEl ? window.getComputedStyle(greetingEl) : null;

        const tzButton = Array.from(document.querySelectorAll('button')).find(el => el.getAttribute('title') === 'Select timezone');
        const tzText = tzButton ? tzButton.innerText : 'NOT FOUND';

        const actionBanner = document.querySelector('.card-ref div[class*="from-[#FFFBEB]"]');
        const actionBannerStyle = actionBanner ? window.getComputedStyle(actionBanner) : null;

        const pipelineHeaderBtn = Array.from(document.querySelectorAll('.card-ref button')).find(b => b.innerText.includes('Add deal'));
        const columnAddBtns = Array.from(document.querySelectorAll('.card-ref .rounded-[14px] button')).filter(b => b.innerText.includes('Add deal'));

        const conversationTabs = Array.from(document.querySelectorAll('.card-ref button')).filter(b => ['All', 'Ongoing', 'Open', 'Closed'].some(t => b.innerText.includes(t))).map(b => b.innerText);

        const campaignHeader = Array.from(document.querySelectorAll('h4')).find(h => h.innerText.includes('Campaign Performance'));
        const teamHeader = Array.from(document.querySelectorAll('h4')).find(h => h.innerText.includes('Team Performance'));

        return {
          greetingFontSize: greetingStyle ? greetingStyle.fontSize : 'none',
          greetingFontWeight: greetingStyle ? greetingStyle.fontWeight : 'none',
          tzText,
          hasActionCautionBanner: !!actionBanner,
          actionBorderLeft: actionBannerStyle ? actionBannerStyle.borderLeftColor : 'none',
          hasCommonAddDealButton: !!pipelineHeaderBtn,
          columnAddBtnCount: columnAddBtns.length,
          conversationTabs,
          hasCampaignPerformance: !!campaignHeader,
          hasTeamPerformance: !!teamHeader
        };
      })()`,
    });

    console.log('DOM Audit Results:', JSON.stringify(auditRes.result.value, null, 2));

    // Capture Full Overview Screenshot
    const screenshot = await sendCommand(ws, 'Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
    });

    const fullPath = path.join(artifactDir, 'overview-updated-proof.png');
    fs.writeFileSync(fullPath, Buffer.from(screenshot.data, 'base64'));
    console.log('Saved full overview screenshot to:', fullPath);

    // Capture Upper Header + Caution Card Crop
    await sendCommand(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 850,
      deviceScaleFactor: 2,
      mobile: false,
    });
    await sleep(200);

    const upperScreenshot = await sendCommand(ws, 'Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    const upperPath = path.join(artifactDir, 'overview-header-caution-crop.png');
    fs.writeFileSync(upperPath, Buffer.from(upperScreenshot.data, 'base64'));
    console.log('Saved header & caution card crop to:', upperPath);

    // Scroll down to capture Sales Pipeline & Recent Conversations
    await sendCommand(ws, 'Runtime.evaluate', {
      expression: 'window.scrollTo(0, 680);',
    });
    await sleep(300);

    const lowerScreenshot = await sendCommand(ws, 'Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    const lowerPath = path.join(artifactDir, 'overview-lower-graphs-crop.png');
    fs.writeFileSync(lowerPath, Buffer.from(lowerScreenshot.data, 'base64'));
    console.log('Saved lower graphs crop to:', lowerPath);

    // Scroll further down to capture Campaign Performance & Team Performance in full view
    await sendCommand(ws, 'Runtime.evaluate', {
      expression: 'window.scrollTo(0, 1350);',
    });
    await sleep(300);

    const bottomScreenshot = await sendCommand(ws, 'Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    const bottomPath = path.join(artifactDir, 'overview-bottom-performance-crop.png');
    fs.writeFileSync(bottomPath, Buffer.from(bottomScreenshot.data, 'base64'));
    console.log('Saved bottom performance crop to:', bottomPath);

    ws.close();
  } finally {
    chrome.kill('SIGKILL');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
