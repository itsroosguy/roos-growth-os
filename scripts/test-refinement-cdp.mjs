import http from "node:http";
import fs from "node:fs";
import path from "node:path";

async function getWsUrl() {
  return new Promise((resolve, reject) => {
    http.get("http://localhost:9252/json/list", (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const list = JSON.parse(data);
          const page = list.find((item) => item.type === "page");
          if (page && page.webSocketDebuggerUrl) {
            resolve(page.webSocketDebuggerUrl);
          } else {
            reject(new Error("No active page target found"));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 1;
    this.pending = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.addEventListener("open", () => resolve());
      this.ws.addEventListener("error", (err) => reject(err));
      this.ws.addEventListener("message", (event) => {
        const res = JSON.parse(event.data);
        if (res.id && this.pending.has(res.id)) {
          const { resolve, reject } = this.pending.get(res.id);
          this.pending.delete(res.id);
          if (res.error) reject(res.error);
          else resolve(res.result);
        }
      });
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  }

  async setViewport(width, height, mobile = false) {
    await this.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 2,
      mobile,
    });
  }

  async navigate(url) {
    await this.send("Page.navigate", { url });
    await new Promise((r) => setTimeout(r, 1200));
  }

  async screenshot(filePath) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(filePath, Buffer.from(res.data, "base64"));
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function run() {
  const wsUrl = await getWsUrl();
  const cdp = new CdpClient(wsUrl);
  await cdp.connect();
  console.log("Connected to browser via CDP:", wsUrl);

  const artifactDir = "/Users/roosstudiox/.gemini/antigravity/brain/79603c97-561b-4418-9da7-26c0f84fdbe6";

  // 1. Desktop 1440px: Test Overview Page & Sidebar Expand/Collapse
  console.log("\n--- TEST 1: DESKTOP 1440px CONCISE OVERVIEW & SIDEBAR ---");
  await cdp.setViewport(1440, 900, false);
  await cdp.navigate("http://localhost:3000/app/demo-corp/overview");

  // Check 4 KPI cards and work area
  const overviewCheck = await cdp.eval(`
    (() => {
      const title = document.querySelector('h1')?.textContent?.trim();
      const kpis = document.querySelectorAll('div.grid.grid-cols-2.lg\\\\:grid-cols-4 > a');
      const hasPriorities = document.body.innerText.includes('Items Requiring Attention');
      const hasPipeline = document.body.innerText.includes('Pipeline Stages');
      const hasActivity = document.body.innerText.includes('Recent Activity');
      const scrollWidth = document.documentElement.scrollWidth;
      const innerWidth = window.innerWidth;
      const noticeVisible = !!document.getElementById('mobile-notice-title');
      return {
        title,
        kpiCount: kpis.length,
        hasPriorities,
        hasPipeline,
        hasActivity,
        overflow: scrollWidth > innerWidth,
        noticeVisible
      };
    })()
  `);
  console.log("Overview check (Desktop 1440px):", overviewCheck);
  await cdp.screenshot(path.join(artifactDir, "refinement-desktop-1440-overview.png"));

  // Check Sidebar Collapsing
  console.log("\n--- TEST 2: SIDEBAR EXPAND & COLLAPSE ---");
  const sidebarBefore = await cdp.eval(`
    (() => {
      const aside = document.querySelector('aside');
      return { width: aside?.offsetWidth, isCollapsed: document.documentElement.classList.contains('sidebar-collapsed') };
    })()
  `);
  console.log("Sidebar before collapse:", sidebarBefore);

  // Click collapse button
  await cdp.eval(`
    (() => {
      const btn = document.querySelector('button[aria-label="Collapse sidebar"]');
      if (btn) btn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 400));

  const sidebarCollapsed = await cdp.eval(`
    (() => {
      const aside = document.querySelector('aside');
      return { width: aside?.offsetWidth, isCollapsed: document.documentElement.classList.contains('sidebar-collapsed') };
    })()
  `);
  console.log("Sidebar after collapse:", sidebarCollapsed);
  await cdp.screenshot(path.join(artifactDir, "refinement-desktop-1440-sidebar-collapsed.png"));

  // Click expand button to restore
  await cdp.eval(`
    (() => {
      const btn = document.querySelector('button[aria-label="Expand sidebar"]');
      if (btn) btn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 400));

  const sidebarRestored = await cdp.eval(`
    (() => {
      const aside = document.querySelector('aside');
      return { width: aside?.offsetWidth, isCollapsed: document.documentElement.classList.contains('sidebar-collapsed') };
    })()
  `);
  console.log("Sidebar restored:", sidebarRestored);

  // 3. Desktop 1920px (Ultra-wide)
  console.log("\n--- TEST 3: DESKTOP 1920px (ULTRA-WIDE) ---");
  await cdp.setViewport(1920, 1080, false);
  await cdp.navigate("http://localhost:3000/app/demo-corp/overview");
  const ultraWideCheck = await cdp.eval(`
    (() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const innerWidth = window.innerWidth;
      const mainMaxW = document.querySelector('main > div')?.offsetWidth;
      return { overflow: scrollWidth > innerWidth, mainMaxW, innerWidth };
    })()
  `);
  console.log("Desktop 1920px check:", ultraWideCheck);
  await cdp.screenshot(path.join(artifactDir, "refinement-desktop-1920-overview.png"));

  // 4. Mobile Notice Test (390px)
  console.log("\n--- TEST 4: MOBILE EXPERIENCE NOTICE (390px) ---");
  await cdp.setViewport(390, 844, true);

  // Clear notice dismissal to ensure it pops up
  await cdp.eval(`
    (() => {
      localStorage.removeItem('roos_mobile_notice_dismissed');
    })()
  `);
  await cdp.navigate("http://localhost:3000/app/demo-corp/overview");
  await new Promise((r) => setTimeout(r, 800));

  const noticeState = await cdp.eval(`
    (() => {
      const modal = document.getElementById('mobile-notice-title');
      const continueBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continue to app'));
      return {
        noticeAppeared: !!modal,
        modalTitle: modal?.textContent,
        hasContinueBtn: !!continueBtn
      };
    })()
  `);
  console.log("Mobile notice check:", noticeState);
  await cdp.screenshot(path.join(artifactDir, "refinement-mobile-390-notice.png"));

  // Dismiss the notice
  await cdp.eval(`
    (() => {
      const continueBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continue to app'));
      if (continueBtn) continueBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 400));

  const noticeAfterDismiss = await cdp.eval(`
    (() => {
      return {
        noticeClosed: !document.getElementById('mobile-notice-title'),
        dismissalSaved: localStorage.getItem('roos_mobile_notice_dismissed') === 'true'
      };
    })()
  `);
  console.log("Notice after continue click:", noticeAfterDismiss);
  await cdp.screenshot(path.join(artifactDir, "refinement-mobile-390-overview-dismissed.png"));

  // 5. Test 14 Pages on Mobile & Desktop for zero overflow
  console.log("\n--- TEST 5: MULTI-PAGE RESPONSIVE OVERFLOW AUDIT ---");
  const pages = [
    "/app/demo-corp/overview",
    "/app/demo-corp/inbox",
    "/app/demo-corp/leads",
    "/app/demo-corp/contacts",
    "/app/demo-corp/campaigns",
    "/app/demo-corp/templates",
    "/app/demo-corp/automations",
    "/app/demo-corp/tasks",
    "/app/demo-corp/reports",
    "/app/demo-corp/team",
    "/app/demo-corp/whatsapp",
    "/app/demo-corp/settings/ai",
    "/app/demo-corp/settings/admin",
    "/app/demo-corp/subscription",
  ];

  for (const page of pages) {
    // Test on 390px (Mobile)
    await cdp.setViewport(390, 844, true);
    await cdp.navigate(`http://localhost:3000${page}`);
    const mobileRes = await cdp.eval(`
      (() => ({
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth
      }))()
    `);

    // Test on 1440px (Desktop)
    await cdp.setViewport(1440, 900, false);
    await cdp.navigate(`http://localhost:3000${page}`);
    const desktopRes = await cdp.eval(`
      (() => ({
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth
      }))()
    `);

    console.log(`Page ${page}: Mobile overflow = ${mobileRes.overflow}, Desktop overflow = ${desktopRes.overflow}`);
  }

  cdp.close();
  console.log("\n✓ ALL REFINEMENT TESTS COMPLETED SUCCESSFULLY!");
}

run().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
