import JSZip from 'jszip';

export async function generateExtensionZip(): Promise<Blob> {
  const zip = new JSZip();

  const manifest = {
    manifest_version: 3,
    name: "DisasterMgmt Automation Companion",
    version: "1.0.0",
    description: "Companion extension for DisasterMgmt flood monitoring and simulation research prototype.",
    permissions: ["storage"],
    host_permissions: [
      "http://127.0.0.1:8765/*",
      "http://localhost/*",
      "https://*.vercel.app/*"
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

  const contentJs = `// Content script for DisasterMgmt extension
(function() {
  if (document.documentElement) {
    document.documentElement.setAttribute('data-disaster-mgmt-extension', 'active');
    document.documentElement.setAttribute('data-extension-version', '1.0.0');
  }

  const script = document.createElement('script');
  script.textContent = \`
    window.__DISASTER_MGMT_EXTENSION__ = {
      version: '1.0.0',
      active: true,
      companionPort: 8765,
      loadedAt: Date.now()
    };
    window.dispatchEvent(new CustomEvent('disaster-mgmt-extension-ready', {
      detail: { version: '1.0.0', active: true }
    }));
  \`;
  (document.head || document.documentElement).appendChild(script);
  script.remove();
})();
`;

  const backgroundJs = `chrome.runtime.onInstalled.addListener(() => {
  console.log('[DisasterMgmt Extension] Installed successfully.');
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
  <div class="title">DisasterMgmt <span class="badge">Active</span></div>
  <p class="desc">The companion extension is running and connected to your active browser session.</p>
</body>
</html>
`;

  const readme = `# DisasterMgmt Chrome Extension

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
