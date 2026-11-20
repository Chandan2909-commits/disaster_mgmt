import JSZip from 'jszip';

export async function generateExtensionZip(): Promise<Blob> {
  const zip = new JSZip();

  const manifest = {
    manifest_version: 3,
    name: "DisasterMgmt Automation Companion",
    version: "1.2.0",
    description: "Companion extension for DisasterMgmt flood monitoring and simulation research prototype.",
    permissions: ["storage", "tabs"],
    host_permissions: [
      "http://127.0.0.1:8765/*",
      "http://localhost/*",
      "https://*.vercel.app/*",
      "https://web.whatsapp.com/*"
    ],
    action: {
      default_popup: "popup.html",
      default_title: "DisasterMgmt Companion"
    },
    content_scripts: [
      {
        matches: [
          "http://localhost/*",
          "http://127.0.0.1/*",
          "https://*.vercel.app/*",
          "https://web.whatsapp.com/*",
          "<all_urls>"
        ],
        js: ["content.js"],
        run_at: "document_start"
      }
    ],
    background: {
      service_worker: "background.js"
    }
  };

  const contentJs = `// Content script for DisasterMgmt extension (CSP Safe)
(function() {
  const isWhatsApp = window.location.hostname === 'web.whatsapp.com';

  if (!isWhatsApp) {
    if (document.documentElement) {
      document.documentElement.setAttribute('data-disaster-mgmt-extension', 'active');
      document.documentElement.setAttribute('data-extension-version', '1.2.0');
    }

    window.postMessage({
      source: 'disaster-mgmt-extension',
      type: 'DISASTER_MGMT_EXTENSION_READY',
      version: '1.2.0',
      active: true
    }, '*');
    return;
  }

  // --- WHATSAPP WEB AUTOMATION & AUTO-SWITCH ---
  console.log('[DisasterMgmt Extension] WhatsApp Web detected.');
  const urlParams = new URLSearchParams(window.location.search);
  const isAutoSend = urlParams.get('disaster_auto_send') === '1' || window.location.href.includes('disaster_auto_send=1');

  if (isAutoSend) {
    console.log('[DisasterMgmt Extension] Auto-send requested. Waiting for compose and send button...');
    let attempts = 0;
    const maxAttempts = 40;

    const timer = setInterval(() => {
      attempts++;
      const sendBtn = document.querySelector('button[aria-label="Send"], span[data-icon="send"]');
      const composeBox = document.querySelector('footer div[contenteditable="true"], div[contenteditable="true"][data-tab="10"]');

      if (sendBtn) {
        console.log('[DisasterMgmt Extension] Send button located! Clicking send...');
        sendBtn.closest('button')?.click();
        clearInterval(timer);

        setTimeout(() => {
          console.log('[DisasterMgmt Extension] Switching back to DisasterMgmt Dashboard...');
          chrome.runtime.sendMessage({ action: 'SWITCH_TO_DASHBOARD' });
        }, 2200);
      } else if (composeBox && composeBox.textContent.trim().length > 0) {
        console.log('[DisasterMgmt Extension] Triggering Enter on compose box...');
        composeBox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
        clearInterval(timer);

        setTimeout(() => {
          chrome.runtime.sendMessage({ action: 'SWITCH_TO_DASHBOARD' });
        }, 2200);
      }

      if (attempts >= maxAttempts) {
        clearInterval(timer);
      }
    }, 500);
  }
})();
`;

  const backgroundJs = `chrome.runtime.onInstalled.addListener(() => {
  console.log('[DisasterMgmt Extension] Installed successfully.');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SWITCH_TO_DASHBOARD') {
    chrome.tabs.query({}, (tabs) => {
      const dashTab = tabs.find(
        (t) => t.url && (t.url.includes('disastermgmt') || t.url.includes('localhost:3000'))
      );
      if (dashTab && dashTab.id) {
        chrome.tabs.update(dashTab.id, { active: true });
      } else {
        chrome.tabs.create({ url: 'https://disastermgmt-chi.vercel.app/' });
      }
    });
  }
});
`;

  const popupHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>DisasterMgmt Companion</title>
  <style>
    body { width: 260px; font-family: sans-serif; padding: 14px; background: #f8f9fa; color: #1e1e1e; margin: 0; }
    .badge { background: #10b981; color: white; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: bold; }
    .title { font-size: 15px; font-weight: bold; margin-bottom: 8px; }
    .desc { font-size: 12px; color: #6b7280; line-height: 1.4; }
  </style>
</head>
<body>
  <div class="title">DisasterMgmt <span class="badge">Active v1.2</span></div>
  <p class="desc">The companion extension is running. Automatically transmits WhatsApp messages and returns tab to the dashboard.</p>
</body>
</html>
`;

  const readme = `# DisasterMgmt Chrome Extension v1.2

## Features:
- Auto-detects in the dashboard on load without disruptive popups.
- Opens WhatsApp Web directly in your active browser, automatically transmits the message, and returns focus to the DisasterMgmt dashboard tab!

## Quick Installation Instructions:
1. Extract this zip file into any folder on your computer.
2. In Google Chrome, go to \`chrome://extensions/\`.
3. Enable "Developer mode" toggle at the top right.
4. Click "Load unpacked" and select the unzipped folder.
5. Refresh the DisasterMgmt dashboard!
`;

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  zip.file("content.js", contentJs);
  zip.file("background.js", backgroundJs);
  zip.file("popup.html", popupHtml);
  zip.file("README.md", readme);

  return await zip.generateAsync({ type: "blob" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
