const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const globalsCssPath = path.join(srcDir, 'app', 'globals.css');
const tailwindConfigPath = path.join(__dirname, '..', 'tailwind.config.ts');

const layoutThrashRegex = /transition(?:-all|-[a-z]+)?\s+(?:[0-9]+m?s\s+)?(?:[a-zA-Z0-9(),.\s-]+\s+)?(?:top|left|right|bottom|margin|padding)/i;

const filesWithViolations = [];
let totalScanned = 0;

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (/\.(tsx|ts|jsx|js|css)$/.test(entry.name)) {
      totalScanned++;
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Exclude comments
        if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) return;

        // Check for layout thrashing transition declarations
        if (layoutThrashRegex.test(line)) {
          filesWithViolations.push({
            file: path.relative(path.join(__dirname, '..'), fullPath),
            line: index + 1,
            snippet: line.trim(),
            issue: 'Layout thrashing transition property detected (top/left/margin/padding). Use GPU translate3d() instead.'
          });
        }
      });
    }
  }
}

console.log('--- STARTING EMIL KOWALSKI ANIMATION PERFORMANCE GUARD ---');
scanDir(srcDir);

// Check globals.css for prefers-reduced-motion and Emil Kowalski curves
const globalsCss = fs.readFileSync(globalsCssPath, 'utf8');
const hasReducedMotion = globalsCss.includes('prefers-reduced-motion: reduce');
const hasDecelCurve = globalsCss.includes('0.16, 1, 0.3, 1');
const hasSpringCurve = globalsCss.includes('0.34, 1.56, 0.64, 1');

// Check tailwind.config.ts
const tailwindConfig = fs.readFileSync(tailwindConfigPath, 'utf8');
const hasExpoOut = tailwindConfig.includes('0.16, 1, 0.3, 1');
const hasSpring = tailwindConfig.includes('0.34, 1.56, 0.64, 1');

let errors = 0;

if (!hasReducedMotion) {
  console.error('FAIL: Missing @media (prefers-reduced-motion: reduce) accessibility fallback in globals.css');
  errors++;
} else {
  console.log('✓ Accessibility media fallback layer (@media (prefers-reduced-motion: reduce)) verified');
}

if (!hasDecelCurve || !hasExpoOut) {
  console.error('FAIL: Missing Emil Kowalski deceleration curve cubic-bezier(0.16, 1, 0.3, 1) in styles');
  errors++;
} else {
  console.log('✓ Emil Kowalski deceleration curve (0.16, 1, 0.3, 1 / easeOutExpo) verified');
}

if (!hasSpringCurve || !hasSpring) {
  console.error('FAIL: Missing Emil Kowalski physics-based spring curve cubic-bezier(0.34, 1.56, 0.64, 1) in styles');
  errors++;
} else {
  console.log('✓ Emil Kowalski physics-based spring curve (0.34, 1.56, 0.64, 1) verified');
}

if (filesWithViolations.length > 0) {
  console.error(`\nFAIL: Detected ${filesWithViolations.length} layout thrashing properties:`);
  filesWithViolations.forEach((v) => {
    console.error(`  - ${v.file}:${v.line} -> ${v.snippet} (${v.issue})`);
  });
  errors++;
} else {
  console.log(`✓ Scanned ${totalScanned} source files: 0 layout-thrashing properties detected`);
}

console.log('\n--- PERFORMANCE GUARD SUMMARY ---');
if (errors === 0) {
  console.log('SUCCESS: Locked 60fps/120fps motion design performance parameters validated!');
  process.exit(0);
} else {
  console.error(`FAILURE: Found ${errors} animation performance violations.`);
  process.exit(1);
}
