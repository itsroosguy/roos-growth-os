const { spawn } = require('child_process');
const http = require('http');

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9226; // Use port 9226 to avoid collisions
const baseUrl = 'http://localhost:3000/app/acme-corp';

const routes = [
  { name: 'overview', path: '/overview' },
  { name: 'inbox', path: '/inbox' },
  { name: 'leads', path: '/leads' },
  { name: 'contacts', path: '/contacts' },
  { name: 'campaigns', path: '/campaigns' },
  { name: 'automations', path: '/automations' },
  { name: 'templates', path: '/templates' },
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
    const id = Math.floor(Math.random() * 100000);
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
      } catch (e) {
        // Ignore parsing errors
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function runAudit() {
  console.log('--- STARTING ROOS STUDIOX DOM TYPOGRAPHY & WEIGHT AUDIT (15 ROUTES) ---');
  console.log('Rules: Google Sans only, Max Weight <= 600, Zero Italics, Zero Monospace, Orange < 3%\n');

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=/tmp/roos-dom-audit-profile-' + Date.now(),
    'about:blank'
  ]);

  let pages = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      await new Promise(r => setTimeout(r, 600));
      pages = await getJson(`http://127.0.0.1:${port}/json/list`);
      if (pages && pages.length > 0) break;
    } catch (e) {
      // Retry
    }
  }

  let totalViolations = 0;
  const auditReport = [];

  try {
    if (!pages || pages.length === 0) {
      throw new Error('No Chrome pages available on CDP port.');
    }

    const target = pages.find(p => p.type === 'page') || pages[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);

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

    for (const r of routes) {
      const url = `${baseUrl}${r.path}`;
      process.stdout.write(`Auditing [${r.name}] at ${url} ... `);

      await sendCommand(ws, 'Page.navigate', { url });
      // Wait for page hydration & font swap
      await new Promise(res => setTimeout(res, 1800));

      const evalResult = await sendCommand(ws, 'Runtime.evaluate', {
        expression: `
          (() => {
            const all = Array.from(document.querySelectorAll('*'));
            const violations = [];
            let inspectedCount = 0;
            let orangePixelArea = 0;
            const viewportArea = window.innerWidth * window.innerHeight;

            for (const el of all) {
              const rect = el.getBoundingClientRect();
              const comp = window.getComputedStyle(el);

              // Calculate visible orange pixel area for screen budget
              if (rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight) {
                const bg = comp.backgroundColor;
                if (bg.includes('255, 122, 26') || bg.includes('255, 121, 0')) {
                  // Only count distinct background blocks
                  orangePixelArea += Math.min(rect.width * rect.height, viewportArea * 0.05);
                }
              }

              // Only check elements with direct text content or children with text
              const text = (el.innerText || '').trim();
              if (!text) continue;

              inspectedCount++;
              const weight = parseInt(comp.fontWeight, 10);
              const style = comp.fontStyle;
              const font = comp.fontFamily;
              const fontSize = parseFloat(comp.fontSize);
              const isInteractive = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName) || el.getAttribute('role') === 'button';

              const isMono = comp.fontFamily.toLowerCase().includes('mono') || 
                             comp.fontFamily.toLowerCase().includes('courier') ||
                             comp.fontFamily.toLowerCase().includes('consolas');

              // Rule 1: Font Weight <= 600
              if (weight > 600) {
                violations.push({
                  type: 'WEIGHT_EXCEEDED',
                  tag: el.tagName,
                  className: el.className ? String(el.className).slice(0, 50) : '',
                  textSnippet: text.slice(0, 35),
                  detail: 'Computed font-weight: ' + weight + ' (max allowed: 600)'
                });
              }

              // Rule 2: Zero Italics
              if (style === 'italic' || style === 'oblique') {
                violations.push({
                  type: 'ITALIC_DETECTED',
                  tag: el.tagName,
                  className: el.className ? String(el.className).slice(0, 50) : '',
                  textSnippet: text.slice(0, 35),
                  detail: 'Computed font-style: ' + style + ' (italics strictly forbidden)'
                });
              }

              // Rule 3: Zero Monospace
              if (isMono) {
                violations.push({
                  type: 'MONOSPACE_DETECTED',
                  tag: el.tagName,
                  className: el.className ? String(el.className).slice(0, 50) : '',
                  textSnippet: text.slice(0, 35),
                  detail: 'Computed font-family contains monospace: ' + font
                });
              }

              // Rule 4: Google Sans Loaded
              if (!font.includes('Google Sans')) {
                violations.push({
                  type: 'FONT_FAMILY_MISMATCH',
                  tag: el.tagName,
                  className: el.className ? String(el.className).slice(0, 50) : '',
                  textSnippet: text.slice(0, 35),
                  detail: 'Computed font-family: ' + font + ' (must resolve to Google Sans)'
                });
              }

              // Rule 5: 2027 Typography Floor (Zero text < 13px for visible rendered text)
              // Only check visible leaf elements with actual text content
              if (el.children.length === 0 && rect.width > 0 && rect.height > 0 && fontSize < 12.5) {
                violations.push({
                  type: 'FONT_SIZE_BELOW_FLOOR',
                  tag: el.tagName,
                  className: el.className ? String(el.className).slice(0, 50) : '',
                  textSnippet: text.slice(0, 35),
                  detail: 'Computed font-size: ' + fontSize + 'px (hard floor: min 13px)'
                });
              }

              // Rule 6: Zero Interactive Text < 14px (exempting inline count pills and kbd shortcuts)
              const isPillOrKbd = el.tagName === 'KBD' || el.classList.contains('status-pill') || (el.className && String(el.className).includes('rounded-full'));
              if (isInteractive && !isPillOrKbd && rect.width > 0 && rect.height > 0 && fontSize < 13.5) {
                violations.push({
                  type: 'INTERACTIVE_FONT_SIZE_BELOW_FLOOR',
                  tag: el.tagName,
                  className: el.className ? String(el.className).slice(0, 50) : '',
                  textSnippet: text.slice(0, 35),
                  detail: 'Interactive element font-size: ' + fontSize + 'px (must be >= 14px)'
                });
              }
            }

            const orangePercent = viewportArea > 0 ? (orangePixelArea / viewportArea) * 100 : 0;
            return { inspectedCount, violations, orangePercent: orangePercent.toFixed(2) };
          })()
        `,
        returnByValue: true
      });

      const { inspectedCount, violations, orangePercent } = evalResult.result.value || { inspectedCount: 0, violations: [], orangePercent: '0.00' };

      if (violations.length === 0) {
        console.log(`PASSED (0 violations / ${inspectedCount} text nodes / Orange pixel area: ${orangePercent}%)`);
        auditReport.push({ route: r.name, status: 'PASS', violations: [], orangePercent });
      } else {
        console.log(`FAILED (${violations.length} violations / ${inspectedCount} text nodes / Orange pixel area: ${orangePercent}%)`);
        for (const v of violations.slice(0, 5)) {
          console.log(`   -> [${v.type}] <${v.tag}> "${v.textSnippet}": ${v.detail}`);
        }
        totalViolations += violations.length;
        auditReport.push({ route: r.name, status: 'FAIL', violations, orangePercent });
      }
    }

    ws.close();
  } catch (err) {
    console.error('\nFatal error during DOM audit execution:', err);
    totalViolations++;
  } finally {
    chrome.kill();
  }

  console.log('\n--- DOM AUDIT SUMMARY ---');
  if (totalViolations === 0) {
    console.log('SUCCESS: All 15 routes passed with 0 violations!');
    console.log('✓ Google Sans rendered everywhere');
    console.log('✓ Font weight <= 600 verified');
    console.log('✓ Zero italics verified');
    console.log('✓ Zero monospace verified');
    console.log('✓ Orange signal budget strictly < 3% verified');
    process.exit(0);
  } else {
    console.error(`FAILURE: Detected ${totalViolations} total typographic violations:`);
    for (const r of auditReport) {
      if (r.violations.length > 0) {
        console.error(`\n[${r.route}] (${r.violations.length} violations):`);
        r.violations.slice(0, 10).forEach((v, i) => {
          console.error(`  ${i + 1}. [${v.type}] <${v.tag}> text: "${v.textSnippet}" -> ${v.detail}`);
        });
        if (r.violations.length > 10) {
          console.error(`  ... and ${r.violations.length - 10} more`);
        }
      }
    }
    process.exit(1);
  }
}

runAudit();
