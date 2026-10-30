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

  // =========================================================================
  // 1. DESKTOP (1440px): VERIFY RESTORED BELOVED RICH OVERVIEW & SIDEBAR
  // =========================================================================
  console.log("\n--- TEST 1: DESKTOP (1440px) RESTORED OVERVIEW ---");
  await cdp.setViewport(1440, 900, false);
  await cdp.navigate("http://localhost:3000/app/demo-corp/overview");

  const desktopAudit = await cdp.eval(`
    (() => {
      const desktopContainer = document.querySelector('.hidden.lg\\\\:block');
      const mobileContainer = document.querySelector('.block.lg\\\\:hidden');
      
      const hasGreeting = document.body.innerText.includes('Praveen');
      const hasBriefing = document.body.innerText.includes('has waited');
      const hasActionRequired = document.body.innerText.includes('Action required') || document.body.innerText.includes('Priority action');
      const hasCampaignPerf = document.body.innerText.includes('Campaign Performance');
      const hasTeamQuota = document.body.innerText.includes('Team Performance');
      const hasTimezone = document.body.innerText.includes('IST') || document.body.innerText.includes('Select Timezone');
      const noticeVisible = !!document.getElementById('mobile-notice-title');

      return {
        desktopContainerVisible: desktopContainer ? desktopContainer.offsetWidth > 0 : false,
        mobileContainerHidden: mobileContainer ? mobileContainer.offsetWidth === 0 : true,
        hasGreeting,
        hasBriefing,
        hasActionRequired,
        hasCampaignPerf,
        hasTeamQuota,
        hasTimezone,
        noticeVisible
      };
    })()
  `);
  console.log("Desktop 1440px audit:", desktopAudit);
  await cdp.screenshot(path.join(artifactDir, "restored-desktop-1440-overview.png"));

  // Check Sidebar
  console.log("\n--- TEST 2: DESKTOP SIDEBAR EXPAND & COLLAPSE ---");
  const sidebarCheck = await cdp.eval(`
    (() => {
      const aside = document.querySelector('aside');
      return { width: aside?.offsetWidth, isCollapsed: document.documentElement.classList.contains('sidebar-collapsed') };
    })()
  `);
  console.log("Sidebar current width:", sidebarCheck);

  // =========================================================================
  // 2. MOBILE (390px): VERIFY KEPT STREAMLINED MOBILE VERSION
  // =========================================================================
  console.log("\n--- TEST 3: MOBILE (390px) KEPT MOBILE VERSION ---");
  await cdp.setViewport(390, 844, true);

  // Clear notice dismissal to test appearance
  await cdp.eval(`localStorage.removeItem('roos_mobile_notice_dismissed');`);
  await cdp.navigate("http://localhost:3000/app/demo-corp/overview");
  await new Promise((r) => setTimeout(r, 600));

  const mobileNoticeCheck = await cdp.eval(`
    (() => {
      const modal = document.getElementById('mobile-notice-title');
      return {
        noticeAppeared: !!modal,
        title: modal?.textContent
      };
    })()
  `);
  console.log("Mobile notice on 390px:", mobileNoticeCheck);
  await cdp.screenshot(path.join(artifactDir, "retained-mobile-390-notice.png"));

  // Dismiss notice
  await cdp.eval(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continue to app'));
      if (btn) btn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 400));

  const mobileOverviewAudit = await cdp.eval(`
    (() => {
      const desktopContainer = document.querySelector('.hidden.lg\\\\:block');
      const mobileContainer = document.querySelector('.block.lg\\\\:hidden');
      const kpis = mobileContainer?.querySelectorAll('.grid-cols-2 > a');
      const hasAttention = mobileContainer?.innerText.includes('Items Requiring Attention');
      const hasStages = mobileContainer?.innerText.includes('Pipeline Stages');

      return {
        desktopContainerHidden: desktopContainer ? desktopContainer.offsetWidth === 0 : true,
        mobileContainerVisible: mobileContainer ? mobileContainer.offsetWidth > 0 : false,
        kpiCount: kpis?.length,
        hasAttention,
        hasStages,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        overflow: document.documentElement.scrollWidth > window.innerWidth
      };
    })()
  `);
  console.log("Mobile overview audit:", mobileOverviewAudit);
  await cdp.screenshot(path.join(artifactDir, "retained-mobile-390-overview.png"));

  cdp.close();
  console.log("\n✓ ALL DESKTOP RESTORE & MOBILE RETENTION TESTS COMPLETED!");
}

run().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
