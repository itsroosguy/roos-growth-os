const { spawn } = require('child_process');
const http = require('http');

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9223;
const targetUrl = 'https://roosstudiox.com/';

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
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
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
      } catch (e) {}
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function extract() {
  const chrome = spawn(chromePath, [
    '--headless',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=/tmp/roos-brand-profile',
    'about:blank'
  ]);

  let pages = null;
  for (let i = 0; i < 10; i++) {
    try {
      await new Promise(r => setTimeout(r, 600));
      pages = await getJson(`http://127.0.0.1:${port}/json/list`);
      if (pages && pages.length > 0) break;
    } catch (e) {}
  }

  try {
    const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r));
    await sendCommand(ws, 'Page.enable');
    await sendCommand(ws, 'Runtime.enable');

    console.log('Navigating to', targetUrl);
    await sendCommand(ws, 'Page.navigate', { url: targetUrl });
    await new Promise(r => setTimeout(r, 4000));

    const result = await sendCommand(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const bodyStyle = window.getComputedStyle(document.body);
          const htmlStyle = window.getComputedStyle(document.documentElement);
          
          const buttons = Array.from(document.querySelectorAll('button, a[href*="contact"], a.btn, a[class*="button"], a[class*="btn"]'));
          const buttonStyles = buttons.map(b => {
            const cs = window.getComputedStyle(b);
            return {
              text: b.innerText.trim().slice(0, 30),
              tag: b.tagName,
              bg: cs.backgroundColor,
              color: cs.color,
              borderRadius: cs.borderRadius,
              border: cs.border,
              boxShadow: cs.boxShadow,
              fontSize: cs.fontSize,
              fontWeight: cs.fontWeight,
              fontFamily: cs.fontFamily,
              padding: cs.padding
            };
          }).filter(b => b.text.length > 0);

          const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
          const headingStyles = headings.slice(0, 10).map(h => {
            const cs = window.getComputedStyle(h);
            return {
              tag: h.tagName,
              text: h.innerText.trim().slice(0, 30),
              color: cs.color,
              fontSize: cs.fontSize,
              fontWeight: cs.fontWeight,
              fontFamily: cs.fontFamily,
              letterSpacing: cs.letterSpacing
            };
          });

          // Scan all colors on page
          const allElements = Array.from(document.querySelectorAll('*'));
          const bgColors = new Set();
          const textColors = new Set();
          const borderColors = new Set();

          allElements.forEach(el => {
            const cs = window.getComputedStyle(el);
            if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') bgColors.add(cs.backgroundColor);
            if (cs.color && cs.color !== 'rgba(0, 0, 0, 0)') textColors.add(cs.color);
            if (cs.borderColor && cs.borderColor !== 'rgba(0, 0, 0, 0)' && cs.borderWidth !== '0px') borderColors.add(cs.borderColor);
          });

          // Check logo
          const logoEl = document.querySelector('img[src*="logo"], svg, a[href="/"] img, header img');
          const logoInfo = logoEl ? { tag: logoEl.tagName, src: logoEl.src || logoEl.innerHTML.slice(0, 100) } : null;

          return {
            body: {
              bg: bodyStyle.backgroundColor,
              color: bodyStyle.color,
              fontFamily: bodyStyle.fontFamily
            },
            html: {
              bg: htmlStyle.backgroundColor
            },
            buttonStyles: buttonStyles.slice(0, 8),
            headingStyles,
            bgColors: Array.from(bgColors),
            textColors: Array.from(textColors),
            borderColors: Array.from(borderColors),
            logoInfo
          };
        })()
      `,
      returnByValue: true
    });

    console.log(JSON.stringify(result.result.value, null, 2));
    ws.close();
  } catch (err) {
    console.error('Error extracting:', err);
  } finally {
    chrome.kill();
  }
}

extract();
