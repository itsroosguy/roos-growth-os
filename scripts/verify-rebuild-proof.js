const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9520;
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
  console.log('--- STARTING ROOS STUDIOX BUSINESS OS VERIFICATION SUITE ---');
  const chrome = spawn(chromePath, [
    '--headless',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=/tmp/roos-proof-profile-' + Date.now(),
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
    if (!pages || pages.length === 0) throw new Error('Could not connect to headless Chrome on port ' + port);

    const pageTarget = pages.find(p => p.type === 'page') || pages[0];
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve);
      ws.addEventListener('error', reject);
    });

    await sendCommand(ws, 'Page.enable');
    await sendCommand(ws, 'DOM.enable');
    await sendCommand(ws, 'CSS.enable');
    await sendCommand(ws, 'Runtime.enable');

    // 1. Emulate Viewport 1440x950
    console.log('\n[1/5] Testing 1440px Viewport...');
    await sendCommand(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 950,
      deviceScaleFactor: 2,
      mobile: false
    });

    console.log('Navigating to fresh session with clean profile...');
    await sendCommand(ws, 'Page.navigate', { url: baseUrl });

    // Wait until h1.type-display is rendered
    let ready = false;
    for (let i = 0; i < 30; i++) {
      const check = await sendCommand(ws, 'Runtime.evaluate', {
        expression: '!!document.querySelector("h1.type-display")'
      });
      if (check && check.result && check.result.value) {
        ready = true;
        break;
      }
      await sleep(300);
    }
    if (!ready) console.warn('Warning: h1.type-display not ready after 9s');
    await sleep(1500); // Allow animations to settle

    // Capture 1440 screenshot
    const shot1440 = await sendCommand(ws, 'Page.captureScreenshot', { format: 'png' });
    const shot1440Path = path.join(artifactDir, 'proof-overview-1440.png');
    fs.writeFileSync(shot1440Path, Buffer.from(shot1440.data, 'base64'));
    console.log(`✓ 1440px viewport screenshot captured: proof-overview-1440.png`);

    // 2. Computed-styles table extraction
    console.log('\n[2/5] Extracting Computed-Style Table...');
    const computedStyles = await sendCommand(ws, 'Runtime.evaluate', {
      expression: `(() => {
        const body = document.body;
        const bodyStyle = window.getComputedStyle(body);
        const headline = document.querySelector('h1.type-display') || document.querySelector('h1');
        const headlineStyle = headline ? window.getComputedStyle(headline) : null;
        const card = document.querySelector('.card-ref') || document.querySelector('.rounded-\\\\[16px\\\\]');
        const cardStyle = card ? window.getComputedStyle(card) : null;
        const sidebar = document.querySelector('aside') || document.querySelector('.sidebar');
        const sidebarStyle = sidebar ? window.getComputedStyle(sidebar) : null;
        const activeNav = document.querySelector('aside a[data-nav-active="true"]') || document.querySelector('aside a[aria-current="page"]');
        const activeNavStyle = activeNav ? window.getComputedStyle(activeNav) : null;
        const primaryBtn = document.querySelector('.btn-primary') || document.querySelector('button.bg-gradient-to-b');
        const primaryBtnStyle = primaryBtn ? window.getComputedStyle(primaryBtn) : null;

        return {
          bodyFont: bodyStyle.fontFamily,
          bodySize: bodyStyle.fontSize,
          headlineSize: headlineStyle ? headlineStyle.fontSize : 'N/A',
          headlineWeight: headlineStyle ? headlineStyle.fontWeight : 'N/A',
          headlineTracking: headlineStyle ? headlineStyle.letterSpacing : 'N/A',
          cardRadius: cardStyle ? cardStyle.borderRadius : 'N/A',
          cardShadow: cardStyle ? cardStyle.boxShadow : 'N/A',
          cardPadding: cardStyle ? cardStyle.padding : 'N/A',
          cardBorder: cardStyle ? cardStyle.borderColor : 'N/A',
          sidebarWidth: sidebarStyle ? sidebarStyle.width : 'N/A',
          sidebarBg: sidebarStyle ? sidebarStyle.backgroundColor : 'N/A',
          activeNavBg: activeNavStyle ? activeNavStyle.backgroundImage : 'N/A',
          primaryBtnBg: primaryBtnStyle ? primaryBtnStyle.backgroundImage : 'N/A',
          primaryBtnRadius: primaryBtnStyle ? primaryBtnStyle.borderRadius : 'N/A'
        };
      })()`,
      returnByValue: true
    });

    console.log('--- COMPUTED STYLES TABLE ---');
    console.table(computedStyles.result.value);

    // 3. Typographic & Constraint Audit
    console.log('\n[3/5] Performing Typography & Constraint Audit...');
    const auditResults = await sendCommand(ws, 'Runtime.evaluate', {
      expression: `(() => {
        const all = Array.from(document.querySelectorAll('*'));
        let italicElements = 0;
        let boldOver600 = 0;
        let under13px = 0;
        let nonGoogleSans = 0;

        all.forEach(el => {
          if (el.children.length > 0) return; // Leaf nodes with text
          const text = el.innerText || el.textContent;
          if (!text || !text.trim()) return;

          const s = window.getComputedStyle(el);
          if (s.fontStyle === 'italic') italicElements++;
          const weight = parseInt(s.fontWeight, 10);
          if (weight > 600) boldOver600++;
          const size = parseFloat(s.fontSize);
          if (size < 12.9) under13px++; // Floor 13px

          const font = s.fontFamily.toLowerCase();
          if (!font.includes('google sans') && !font.includes('sans-serif') && !font.includes('system-ui')) {
            nonGoogleSans++;
          }
        });

        const activeNavPills = document.querySelectorAll('aside a[data-nav-active="true"]');

        return {
          italicCount: italicElements,
          boldOver600Count: boldOver600,
          under13pxCount: under13px,
          nonGoogleSansCount: nonGoogleSans,
          activeNavCount: activeNavPills.length
        };
      })()`,
      returnByValue: true
    });
    console.log('--- DOM AUDIT SUMMARY ---');
    console.table(auditResults.result.value);

    // 4. Capture 8px blur screenshot
    console.log('\n[4/5] Capturing 8px Blurred Screenshot for Visual Hierarchy Check...');
    await sendCommand(ws, 'Runtime.evaluate', {
      expression: `document.body.style.filter = 'blur(8px)';`
    });
    await sleep(400);
    const blurredShot = await sendCommand(ws, 'Page.captureScreenshot', { format: 'png' });
    const blurredPath = path.join(artifactDir, 'proof-overview-blurred-8px.png');
    fs.writeFileSync(blurredPath, Buffer.from(blurredShot.data, 'base64'));
    console.log(`✓ 8px blur screenshot captured: proof-overview-blurred-8px.png`);

    // Reset blur
    await sendCommand(ws, 'Runtime.evaluate', {
      expression: `document.body.style.filter = 'none';`
    });
    await sleep(200);

    // 5. Emulate Viewport 2560x1440
    console.log('\n[5/5] Testing 2560px Viewport (Large Desktop / 4K)...');
    await sendCommand(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 2560,
      height: 1440,
      deviceScaleFactor: 2,
      mobile: false
    });
    await sleep(1000);
    const shot2560 = await sendCommand(ws, 'Page.captureScreenshot', { format: 'png' });
    const shot2560Path = path.join(artifactDir, 'proof-overview-2560.png');
    fs.writeFileSync(shot2560Path, Buffer.from(shot2560.data, 'base64'));
    console.log(`✓ 2560px viewport screenshot captured: proof-overview-2560.png`);

    console.log('\n--- VERIFICATION SUITE COMPLETE ---');
    ws.close();
  } finally {
    chrome.kill();
  }
}

main().catch(err => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
