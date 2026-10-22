const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.EMAIL_PREVIEW_PORT || 4200;
const TEMPLATE_PATH = path.join(__dirname, "../docs/templates/registration_confirmation_email.html");

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Endpoint to get raw template text
  if (url.pathname === "/raw") {
    if (!fs.existsSync(TEMPLATE_PATH)) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Template file not found at " + TEMPLATE_PATH);
    }
    const rawContent = fs.readFileSync(TEMPLATE_PATH, "utf8");
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end(rawContent);
  }

  // Standalone rendered HTML without preview toolbar
  if (url.pathname === "/frame") {
    if (!fs.existsSync(TEMPLATE_PATH)) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Template not found");
    }
    let content = fs.readFileSync(TEMPLATE_PATH, "utf8");
    content = content
      .replace(/{{\s*\.ConfirmationURL\s*}}/g, "http://localhost:8080/auth/verified")
      .replace(/{{\s*\.Email\s*}}/g, "rathod@codeaurora.in")
      .replace(/{{\s*\.Year\s*}}/g, new Date().getFullYear().toString());

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(content);
  }

  // Interactive Live Preview Environment
  if (url.pathname === "/" || url.pathname === "/preview") {
    const previewHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sentinel Email Template Live Preview &bull; CodeAurora</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #090a0f;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    header {
      background: #0f1117;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      z-index: 10;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .badge {
      font-size: 11px;
      font-weight: 800;
      background: rgba(46, 240, 110, 0.15);
      color: #2ef06e;
      border: 1px solid rgba(46, 240, 110, 0.3);
      padding: 3px 8px;
      border-radius: 9999px;
      letter-spacing: 0.5px;
    }
    .controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn {
      background: #171923;
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn:hover {
      background: #232736;
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.25);
    }
    .btn.active {
      background: #2ef06e;
      color: #000000;
      border-color: #2ef06e;
      box-shadow: 0 0 16px rgba(46, 240, 110, 0.3);
    }
    .btn-emerald {
      background: rgba(46, 240, 110, 0.15);
      color: #2ef06e;
      border: 1px solid rgba(46, 240, 110, 0.3);
    }
    .btn-emerald:hover {
      background: #2ef06e;
      color: #000000;
    }
    .preview-container {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #050608;
      background-image: radial-gradient(rgba(46, 240, 110, 0.05) 1px, transparent 1px);
      background-size: 24px 24px;
      padding: 20px;
      overflow: auto;
    }
    .device-frame {
      background: #060709;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 14px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9);
      transition: all 0.25s ease;
      height: 100%;
      width: 100%;
      max-width: 680px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .device-frame.mobile {
      max-width: 390px;
      border-radius: 36px;
      border: 6px solid #1f2430;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1), 0 30px 80px rgba(0,0,0,0.9);
    }
    .device-bar {
      background: #11131a;
      padding: 8px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: #718096;
    }
    .dots {
      display: flex;
      gap: 5px;
    }
    .dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #2d3748;
    }
    .dot.r { background: #e53e3e; }
    .dot.y { background: #dd6b20; }
    .dot.g { background: #38a169; }
    iframe {
      border: none;
      width: 100%;
      flex: 1;
      height: 100%;
      background: #060709;
    }
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #16a34a;
      color: #fff;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.2s ease;
      pointer-events: none;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }
    .toast.show {
      opacity: 1;
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <span style="font-size: 20px;">🛡️</span>
      <strong style="color: #ffffff; letter-spacing: -0.3px;">CodeAurora Sentinel AI</strong>
      <span class="badge">EMAIL PREVIEW SERVER</span>
      <span style="font-size: 12px; color: #718096; margin-left: 6px;">Port ${PORT}</span>
    </div>

    <div class="controls">
      <button class="btn active" id="btnDesktop" onclick="setMode('desktop')">
        🖥️ Desktop (680px)
      </button>
      <button class="btn" id="btnMobile" onclick="setMode('mobile')">
        📱 Mobile (390px)
      </button>
      <button class="btn" onclick="refreshFrame()">
        🔄 Refresh
      </button>
      <a class="btn btn-emerald" href="/frame" target="_blank">
        ↗️ Open Full Tab
      </a>
      <button class="btn" onclick="copySupabaseCode()">
        📋 Copy Supabase HTML
      </button>
    </div>
  </header>

  <div class="preview-container">
    <div class="device-frame" id="deviceFrame">
      <div class="device-bar">
        <div class="dots">
          <span class="dot r"></span>
          <span class="dot y"></span>
          <span class="dot g"></span>
        </div>
        <span id="dimensionLabel">Desktop View &bull; 680px</span>
        <span>Recipient: rathod@codeaurora.in</span>
      </div>
      <iframe id="previewIframe" src="/frame"></iframe>
    </div>
  </div>

  <div class="toast" id="toast">Copied to clipboard!</div>

  <script>
    function setMode(mode) {
      const frame = document.getElementById('deviceFrame');
      const btnD = document.getElementById('btnDesktop');
      const btnM = document.getElementById('btnMobile');
      const label = document.getElementById('dimensionLabel');

      if (mode === 'mobile') {
        frame.classList.add('mobile');
        btnM.classList.add('active');
        btnD.classList.remove('active');
        label.innerText = 'Mobile iPhone View • 390px';
      } else {
        frame.classList.remove('mobile');
        btnD.classList.add('active');
        btnM.classList.remove('active');
        label.innerText = 'Desktop View • 680px';
      }
    }

    function refreshFrame() {
      const iframe = document.getElementById('previewIframe');
      iframe.src = '/frame?t=' + Date.now();
    }

    async function copySupabaseCode() {
      try {
        const res = await fetch('/raw');
        const text = await res.text();
        await navigator.clipboard.writeText(text);
        showToast('HTML copied! Paste directly into Supabase Confirm signup template.');
      } catch (e) {
        showToast('Failed to copy: ' + e.message);
      }
    }

    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.innerText = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2800);
    }
  </script>
</body>
</html>`;
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(previewHtml);
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n========================================================`);
  console.log(`  Sentinel Email Template Preview Server Running!`);
  console.log(`  Preview URL:       http://localhost:${PORT}`);
  console.log(`  Direct HTML Frame: http://localhost:${PORT}/frame`);
  console.log(`  Raw Template:      http://localhost:${PORT}/raw`);
  console.log(`========================================================\n`);
});
