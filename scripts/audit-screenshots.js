const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const baseUrl = 'http://localhost:3000/app/acme-corp';
const outDir = path.join(__dirname, '..', 'screenshots', 'audit');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const viewports = [
  { name: '1440', width: 1440, height: 900 },
  { name: '1024', width: 1024, height: 768 },
  { name: '768', width: 768, height: 1024 },
  { name: '390', width: 390, height: 844 },
];

const routes = [
  { name: 'overview', path: '/overview' },
  { name: 'inbox', path: '/inbox' },
  { name: 'leads', path: '/leads' },
  { name: 'contacts', path: '/contacts' },
  { name: 'tasks', path: '/tasks' },
  { name: 'campaigns', path: '/campaigns' },
  { name: 'automations', path: '/automations' },
  { name: 'templates', path: '/templates' },
  { name: 'reports', path: '/reports' },
  { name: 'team', path: '/team' },
];

for (const route of routes) {
  for (const vp of viewports) {
    const outFile = path.join(outDir, `${route.name}-${vp.name}.png`);
    const targetUrl = `${baseUrl}${route.path}`;
    const cmd = `"${chromePath}" --headless --disable-gpu --screenshot="${outFile}" --window-size=${vp.width},${vp.height} "${targetUrl}"`;
    try {
      execSync(cmd, { stdio: 'ignore' });
      console.log(`Saved: ${route.name}-${vp.name}.png`);
    } catch (e) {
      console.error(`Failed: ${route.name}-${vp.name}`, e.message);
    }
  }
}
