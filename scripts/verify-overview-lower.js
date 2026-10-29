const http = require("http");
const fs = require("fs");
const { spawn } = require("child_process");

const port = 9255;
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless",
  "--disable-gpu",
  `--remote-debugging-port=${port}`,
  "--user-data-dir=/tmp/roos-lower-" + Date.now(),
  "about:blank"
]);

function getJson(url) {
  return new Promise((res, rej) => {
    http.get(url, r => {
      let d = "";
      r.on("data", c => d += c);
      r.on("end", () => res(JSON.parse(d)));
    }).on("error", rej);
  });
}

function send(ws, method, params = {}) {
  return new Promise((res, rej) => {
    const id = Math.floor(Math.random() * 10000000);
    const handler = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.id === id) {
          ws.removeEventListener("message", handler);
          if (msg.error) rej(new Error(msg.error.message));
          else res(msg.result);
        }
      } catch (e) {}
    };
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

(async () => {
  let pages = null;
  for (let i = 0; i < 20; i++) {
    try {
      await new Promise(r => setTimeout(r, 600));
      pages = await getJson(`http://127.0.0.1:${port}/json/list`);
      if (pages && pages.length > 0) break;
    } catch (e) {}
  }
  const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener("open", r));
  await send(ws, "Page.enable");
  await send(ws, "Runtime.enable");
  await send(ws, "Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false
  });

  await send(ws, "Page.navigate", { url: "http://localhost:3000/app/acme-corp/overview" });
  await new Promise(r => setTimeout(r, 2000));

  // Scroll down by 550px to view Row 3 (Day Rail and Up Next)
  await send(ws, "Runtime.evaluate", {
    expression: `window.scrollTo({ top: 550, behavior: "instant" })`
  });
  await new Promise(r => setTimeout(r, 800));

  const snap = await send(ws, "Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("/Users/roosstudiox/.gemini/antigravity/brain/79603c97-561b-4418-9da7-26c0f84fdbe6/overview-lower-dayrail.png", Buffer.from(snap.data, "base64"));
  console.log("Saved overview-lower-dayrail.png");

  chrome.kill();
  process.exit(0);
})();
