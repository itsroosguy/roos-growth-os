const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9245;
const baseUrl = 'http://localhost:3000/app/acme-corp';

const outDir = path.join(__dirname, '..', 'screenshots', 'after');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
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
  console.log('--- STARTING VISUAL LAYER PROOF SUITE ---');
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=/tmp/roos-proof-profile-' + Date.now(),
    'about:blank'
  ]);

  let pages = null;
  for (let i = 0; i < 25; i++) {
    try {
      await new Promise(r => setTimeout(r, 400));
      pages = await getJson(`http://127.0.0.1:${port}/json/list`);
      if (pages && pages.length > 0) break;
    } catch (e) {}
  }

  if (!pages || pages.length === 0) {
    console.error('Failed to connect to headless Chrome');
    chrome.kill();
    process.exit(1);
  }

  const pageTarget = pages.find(p => p.type === 'page' && !p.url.startsWith('chrome-extension')) || pages.find(p => p.type === 'page') || pages[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));

  await sendCommand(ws, 'Page.enable');
  await sendCommand(ws, 'Runtime.enable');
  await sendCommand(ws, 'DOM.enable');
  await sendCommand(ws, 'CSS.enable');

  // Set viewport to 1440x900
  await sendCommand(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false
  });

  // Navigate to Overview
  await sendCommand(ws, 'Page.navigate', { url: `${baseUrl}/overview` });
  await new Promise(r => setTimeout(r, 2200));

  // =========================================================================
  // PROOF A: COMPUTED-STYLE TABLE
  // =========================================================================
  console.log('\n================ PROOF (a): COMPUTED STYLES EVALUATION ================');
  const stylesEval = await sendCommand(ws, 'Runtime.evaluate', {
    expression: `
      (() => {
        const getStyles = (sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const cs = window.getComputedStyle(el);
          return {
            fontFamily: cs.fontFamily,
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight,
            lineHeight: cs.lineHeight,
            letterSpacing: cs.letterSpacing,
            borderRadius: cs.borderRadius,
            boxShadow: cs.boxShadow,
            padding: cs.padding && cs.padding !== '0px' ? cs.padding : (cs.paddingTop + ' ' + cs.paddingRight + ' ' + cs.paddingBottom + ' ' + cs.paddingLeft),
            background: cs.background,
            backgroundColor: cs.backgroundColor,
            backgroundImage: cs.backgroundImage,
            color: cs.color,
            width: cs.width,
            height: cs.height,
            position: cs.position,
            top: cs.top,
            bottom: cs.bottom,
            left: cs.left,
            right: cs.right
          };
        };

        return {
          body: getStyles('body'),
          h1: getStyles('h1'),
          card: getStyles('.card'),
          heroInk: getStyles('.hero-ink'),
          btnPrimary: getStyles('.btn-primary'),
          sidebar: getStyles('.sidebar'),
          navItem: getStyles('.nav-item'),
          activeNavItem: getStyles('.nav-item[aria-current="page"]')
        };
      })()
    `,
    returnByValue: true
  });

  const styles = stylesEval.result.value;
  console.table({
    'body': {
      'Font Family': styles.body?.fontFamily,
      'Font Size': styles.body?.fontSize,
      'Background': styles.body?.backgroundImage?.substring(0, 45) + '...'
    },
    'h1': {
      'Font Size': styles.h1?.fontSize,
      'Font Weight': styles.h1?.fontWeight,
      'Line Height': styles.h1?.lineHeight,
      'Letter Spacing': styles.h1?.letterSpacing
    },
    '.card': {
      'Border Radius': styles.card?.borderRadius,
      'Box Shadow': styles.card?.boxShadow,
      'Padding': styles.card?.padding,
      'Background': styles.card?.backgroundColor
    },
    '.hero-ink': {
      'Border Radius': styles.heroInk?.borderRadius,
      'Padding': styles.heroInk?.padding,
      'Background': styles.heroInk?.backgroundImage?.substring(0, 45) + '...',
      'Color': styles.heroInk?.color
    },
    '.btn-primary': {
      'Border Radius': styles.btnPrimary?.borderRadius,
      'Height': styles.btnPrimary?.height,
      'Padding': styles.btnPrimary?.padding,
      'Font Weight': styles.btnPrimary?.fontWeight,
      'Background': (styles.btnPrimary?.backgroundImage?.includes('linear-gradient') ? styles.btnPrimary?.backgroundImage : styles.btnPrimary?.backgroundColor)?.substring(0, 45) + '...'
    },
    '.sidebar': {
      'Position': styles.sidebar?.position,
      'Width': styles.sidebar?.width,
      'Border Radius': styles.sidebar?.borderRadius,
      'Background': styles.sidebar?.backgroundColor,
      'Inset': `top:${styles.sidebar?.top} left:${styles.sidebar?.left} bottom:${styles.sidebar?.bottom}`
    },
    '.nav-item': {
      'Height': styles.navItem?.height,
      'Border Radius': styles.navItem?.borderRadius,
      'Font Size': styles.navItem?.fontSize,
      'Color': styles.navItem?.color
    },
    'active nav-item': {
      'Background': styles.activeNavItem?.backgroundColor,
      'Color': styles.activeNavItem?.color
    }
  });

  // =========================================================================
  // PROOF B: SCREENSHOTS AT 1440 AND 2560 WIDTHS
  // =========================================================================
  console.log('\n================ PROOF (b): SCREENSHOTS (1440 & 2560) ================');
  const captureRoutes = [
    { name: 'overview', url: `${baseUrl}/overview` },
    { name: 'inbox', url: `${baseUrl}/inbox` },
    { name: 'pipeline', url: `${baseUrl}/leads` },
    { name: 'contacts', url: `${baseUrl}/contacts` }
  ];

  for (const r of captureRoutes) {
    for (const w of [1440, 2560]) {
      const h = w === 1440 ? 900 : 1440;
      await sendCommand(ws, 'Emulation.setDeviceMetricsOverride', {
        width: w,
        height: h,
        deviceScaleFactor: 2,
        mobile: false
      });
      await sendCommand(ws, 'Page.navigate', { url: r.url });
      await new Promise(res => setTimeout(res, 1800));

      const snap = await sendCommand(ws, 'Page.captureScreenshot', { format: 'png' });
      const filename = `${r.name}-${w}.png`;
      fs.writeFileSync(path.join(outDir, filename), Buffer.from(snap.data, 'base64'));
      console.log(`Saved screenshot: screenshots/after/${filename}`);
    }
  }

  // =========================================================================
  // PROOF C: 8PX BLURRED SCREENSHOTS & FOCAL POINT CHECK
  // =========================================================================
  console.log('\n================ PROOF (c): 8PX BLURRED SCREENSHOTS ================');
  for (const r of captureRoutes) {
    for (const w of [1440, 2560]) {
      const h = w === 1440 ? 900 : 1440;
      await sendCommand(ws, 'Emulation.setDeviceMetricsOverride', {
        width: w,
        height: h,
        deviceScaleFactor: 2,
        mobile: false
      });
      await sendCommand(ws, 'Page.navigate', { url: r.url });
      await new Promise(res => setTimeout(res, 1500));

      // Apply 8px blur to html
      await sendCommand(ws, 'Runtime.evaluate', {
        expression: `document.documentElement.style.filter = 'blur(8px)';`
      });
      await new Promise(res => setTimeout(res, 400));

      const blurSnap = await sendCommand(ws, 'Page.captureScreenshot', { format: 'png' });
      const blurFilename = `${r.name}-${w}-blurred-8px.png`;
      fs.writeFileSync(path.join(outDir, blurFilename), Buffer.from(blurSnap.data, 'base64'));
      console.log(`Saved blurred: screenshots/after/${blurFilename}`);

      // Reset filter
      await sendCommand(ws, 'Runtime.evaluate', {
        expression: `document.documentElement.style.filter = '';`
      });
    }
  }

  // =========================================================================
  // PROOF D: AUTOMATED AUDIT ACROSS 15 ROUTES
  // =========================================================================
  console.log('\n================ PROOF (d): AUTOMATED AUDIT (15 ROUTES) ================');
  const allRoutes = [
    '/overview', '/inbox', '/leads', '/contacts', '/campaigns',
    '/templates', '/automations', '/tasks', '/reports', '/team',
    '/whatsapp', '/settings/ai', '/settings/admin', '/subscription', '/settings'
  ];

  await sendCommand(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false
  });

  let totalViolations = 0;
  for (const route of allRoutes) {
    await sendCommand(ws, 'Page.navigate', { url: `${baseUrl}${route}` });
    await new Promise(res => setTimeout(res, 1200));

    const audit = await sendCommand(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const violations = [];
          const allEls = Array.from(document.querySelectorAll('*'));

          // 1. One active nav item
          const activeNavs = document.querySelectorAll('.nav-item[aria-current="page"]');
          if (activeNavs.length !== 1) {
            violations.push({ type: 'active-nav-count', count: activeNavs.length });
          }

          // 2. Strict Typography checks
          allEls.forEach(el => {
            const cs = window.getComputedStyle(el);
            // Visibility check
            if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return;
            const text = (el.innerText || '').trim();
            if (!text && el.tagName !== 'INPUT' && el.tagName !== 'BUTTON') return;

            // Monospace
            const font = cs.fontFamily.toLowerCase();
            if (font.includes('mono') || font.includes('courier') || font.includes('consolas')) {
              violations.push({ type: 'monospace', tag: el.tagName, text: text.substring(0, 30) });
            }

            // Weight > 600
            const weight = parseInt(cs.fontWeight) || 400;
            if (weight > 600) {
              violations.push({ type: 'weight>600', weight, tag: el.tagName, text: text.substring(0, 30) });
            }

            // Italics
            if (cs.fontStyle === 'italic' || cs.fontStyle === 'oblique') {
              violations.push({ type: 'italic', tag: el.tagName, text: text.substring(0, 30) });
            }

            // Floor 13px (exclude hidden or icon SVGs)
            if (text && el.children.length === 0) {
              const size = parseFloat(cs.fontSize) || 16;
              if (size < 12.9) {
                violations.push({ type: 'text<13px', size, tag: el.tagName, text: text.substring(0, 30) });
              }
            }
          });

          return { route: window.location.pathname, violations };
        })()
      `,
      returnByValue: true
    });

    const res = audit.result.value;
    if (res.violations.length === 0) {
      console.log(`✓ ${route} — 0 violations`);
    } else {
      console.log(`✗ ${route} — ${res.violations.length} violations:`, JSON.stringify(res.violations.slice(0, 3)));
      totalViolations += res.violations.length;
    }
  }

  console.log(`\nAudit completed: ${totalViolations} total violations.`);

  ws.close();
  chrome.kill();

  if (totalViolations > 0) {
    process.exit(1);
  }
}

main().catch(e => {
  console.error('Proof suite failed:', e);
  process.exit(1);
});
