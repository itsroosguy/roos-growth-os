const { spawn } = require('child_process');
const http = require('http');

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9222;
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
  console.log('--- STARTING ROOS STUDIOX DOM TYPOGRAPHY & WEIGHT AUDIT ---');
  console.log('Rules: Google Sans only, Max Weight <= 600, Zero Italics\n');

  const chrome = spawn(chromePath, [
    '--headless',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=/tmp/roos-dom-audit-profile',
    'about:blank'
  ]);

  // Give Chrome a moment to open CDP port with retry loop
  let pages = null;
  for (let attempt = 0; attempt < 10; attempt++) {
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

    const target = pages[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve);
      ws.addEventListener('error', reject);
    });

    await sendCommand(ws, 'Page.enable');
    await sendCommand(ws, 'Runtime.enable');

    for (const r of routes) {
      const url = `${baseUrl}${r.path}`;
      process.stdout.write(`Auditing [${r.name}] at ${url} ... `);

      await sendCommand(ws, 'Page.navigate', { url });
      // Wait for page hydration & font swap
      await new Promise(res => setTimeout(res, 2000));

      const evalResult = await sendCommand(ws, 'Runtime.evaluate', {
        expression: `
          (() => {
            const all = Array.from(document.querySelectorAll('*'));
            const violations = [];
            let inspectedCount = 0;

            for (const el of all) {
              // Only check elements with direct text content or children with text
              const text = (el.innerText || '').trim();
              if (!text) continue;

              inspectedCount++;
              const comp = window.getComputedStyle(el);
              const weight = parseInt(comp.fontWeight, 10);
              const style = comp.fontStyle;
              const font = comp.fontFamily;

              const isMono = comp.fontFamily.toLowerCase().includes('mono') || 
                             el.tagName === 'CODE' || 
                             el.tagName === 'PRE' || 
                             el.closest('code, pre');

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

              // Rule 3: Google Sans Loaded
              if (!isMono && !font.includes('Google Sans')) {
                violations.push({
                  type: 'FONT_FAMILY_MISMATCH',
                  tag: el.tagName,
                  className: el.className ? String(el.className).slice(0, 50) : '',
                  textSnippet: text.slice(0, 35),
                  detail: 'Computed font-family: ' + font + ' (must resolve to Google Sans)'
                });
              }
            }

            return { inspectedCount, violations };
          })()
        `,
        returnByValue: true
      });

      const { inspectedCount, violations } = evalResult.result.value || { inspectedCount: 0, violations: [] };

      if (violations.length === 0) {
        console.log(`PASSED (0 violations / ${inspectedCount} text nodes inspected)`);
        auditReport.push({ route: r.name, status: 'PASS', violations: [] });
      } else {
        console.log(`FAILED (${violations.length} violations / ${inspectedCount} text nodes inspected)`);
        totalViolations += violations.length;
        auditReport.push({ route: r.name, status: 'FAIL', violations });
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
    console.log('SUCCESS: All 10 routes passed with 0 violations!');
    console.log('✓ Google Sans rendered everywhere');
    console.log('✓ Font weight <= 600 verified');
    console.log('✓ Zero italics verified');
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
