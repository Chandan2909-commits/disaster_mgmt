// Content script for DisasterMgmt extension (100% CSP compliant, no inline scripts)
(function() {
  const isWhatsApp = window.location.hostname === 'web.whatsapp.com';

  if (!isWhatsApp) {
    // 1. Mark presence in DOM dataset on Dashboard pages (CSP Safe)
    if (document.documentElement) {
      document.documentElement.setAttribute('data-disaster-mgmt-extension', 'active');
      document.documentElement.setAttribute('data-extension-version', '1.2.0');
    }

    // 2. Broadcast via window.postMessage (CSP Safe, no inline <script> tag)
    window.postMessage(
      {
        source: 'disaster-mgmt-extension',
        type: 'DISASTER_MGMT_EXTENSION_READY',
        version: '1.2.0',
        active: true,
      },
      '*'
    );
    return;
  }

  // --- WHATSAPP WEB AUTOMATION & AUTO-SWITCH ---
  console.log('[DisasterMgmt Extension] WhatsApp Web detected.');

  const urlParams = new URLSearchParams(window.location.search);
  const isAutoSend =
    urlParams.get('disaster_auto_send') === '1' || window.location.href.includes('disaster_auto_send=1');

  if (isAutoSend) {
    console.log('[DisasterMgmt Extension] Auto-send requested. Waiting for WhatsApp compose and send button...');

    let attempts = 0;
    const maxAttempts = 40; // ~20 seconds

    const timer = setInterval(() => {
      attempts++;

      // Look for send button or compose box
      const sendBtn = document.querySelector('button[aria-label="Send"], span[data-icon="send"]');
      const composeBox = document.querySelector(
        'footer div[contenteditable="true"], div[contenteditable="true"][data-tab="10"]'
      );

      if (sendBtn) {
        console.log('[DisasterMgmt Extension] Send button located! Clicking send...');
        sendBtn.closest('button')?.click();
        clearInterval(timer);

        setTimeout(() => {
          console.log('[DisasterMgmt Extension] Switching back to DisasterMgmt Dashboard...');
          chrome.runtime.sendMessage({ action: 'SWITCH_TO_DASHBOARD' });
        }, 2200);
      } else if (composeBox && composeBox.textContent.trim().length > 0) {
        console.log('[DisasterMgmt Extension] Triggering Enter key on compose box...');
        composeBox.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true })
        );
        clearInterval(timer);

        setTimeout(() => {
          chrome.runtime.sendMessage({ action: 'SWITCH_TO_DASHBOARD' });
        }, 2200);
      }

      if (attempts >= maxAttempts) {
        clearInterval(timer);
        console.log('[DisasterMgmt Extension] Auto-send check complete.');
      }
    }, 500);
  }
})();
