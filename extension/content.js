// Content script for DisasterMgmt extension
(function() {
  const isWhatsApp = window.location.hostname === 'web.whatsapp.com';

  if (!isWhatsApp) {
    // 1. Mark presence in DOM dataset on Dashboard pages
    if (document.documentElement) {
      document.documentElement.setAttribute('data-disaster-mgmt-extension', 'active');
      document.documentElement.setAttribute('data-extension-version', '1.2.0');
    }

    // 2. Inject bridge script into the page window context
    const script = document.createElement('script');
    script.textContent = `
      window.__DISASTER_MGMT_EXTENSION__ = {
        version: '1.2.0',
        active: true,
        companionPort: 8765,
        loadedAt: Date.now()
      };
      window.dispatchEvent(new CustomEvent('disaster-mgmt-extension-ready', {
        detail: { version: '1.2.0', active: true }
      }));
    `;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
    return;
  }

  // --- WHATSAPP WEB AUTOMATION & AUTO-SWITCH ---
  console.log('[DisasterMgmt Extension] WhatsApp Web detected.');

  const urlParams = new URLSearchParams(window.location.search);
  const isAutoSend = urlParams.get('disaster_auto_send') === '1' || window.location.href.includes('disaster_auto_send=1');

  if (isAutoSend) {
    console.log('[DisasterMgmt Extension] Auto-send requested. Waiting for WhatsApp compose and send button...');

    let attempts = 0;
    const maxAttempts = 35; // ~17.5 seconds

    const timer = setInterval(() => {
      attempts++;

      // Look for send button or compose box
      const sendBtn = document.querySelector('button[aria-label="Send"], span[data-icon="send"]');
      const composeBox = document.querySelector('footer div[contenteditable="true"], div[contenteditable="true"][data-tab="10"]');

      if (sendBtn) {
        console.log('[DisasterMgmt Extension] Send button located! Clicking send...');
        sendBtn.closest('button')?.click();
        clearInterval(timer);

        // Wait 2.5 seconds to confirm transmission, then switch back to dashboard
        setTimeout(() => {
          console.log('[DisasterMgmt Extension] Switching back to DisasterMgmt Dashboard...');
          chrome.runtime.sendMessage({ action: 'SWITCH_TO_DASHBOARD' });
        }, 2200);
      } else if (composeBox && composeBox.textContent.trim().length > 0) {
        // Press Enter
        console.log('[DisasterMgmt Extension] Triggering Enter key on compose box...');
        composeBox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
        clearInterval(timer);

        setTimeout(() => {
          chrome.runtime.sendMessage({ action: 'SWITCH_TO_DASHBOARD' });
        }, 2200);
      }

      if (attempts >= maxAttempts) {
        clearInterval(timer);
        console.log('[DisasterMgmt Extension] Auto-send attempt window finished.');
      }
    }, 500);
  }
})();
