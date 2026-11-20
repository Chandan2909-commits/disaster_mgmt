// Content script for DisasterMgmt extension (100% CSP compliant, handles "Send message to" modal)
(function() {
  const isWhatsApp = window.location.hostname === 'web.whatsapp.com';

  if (!isWhatsApp) {
    if (document.documentElement) {
      document.documentElement.setAttribute('data-disaster-mgmt-extension', 'active');
      document.documentElement.setAttribute('data-extension-version', '1.3.0');
    }

    window.postMessage(
      {
        source: 'disaster-mgmt-extension',
        type: 'DISASTER_MGMT_EXTENSION_READY',
        version: '1.3.0',
        active: true,
      },
      '*'
    );
    return;
  }

  // --- WHATSAPP WEB AUTOMATION ---
  console.log('[DisasterMgmt Extension] WhatsApp Web active.');

  const urlParams = new URLSearchParams(window.location.search);
  const isAutoSend =
    urlParams.get('disaster_auto_send') === '1' || window.location.href.includes('disaster_auto_send=1');
  const targetName = (
    urlParams.get('disaster_target') ||
    'disaster_mgmt_research_paper'
  ).trim();

  if (isAutoSend) {
    console.log(`[DisasterMgmt Extension] Auto-send active for target: "${targetName}".`);

    let sent = false;
    let attempts = 0;
    const maxAttempts = 60; // 30 seconds

    const timer = setInterval(() => {
      attempts++;
      if (sent) {
        clearInterval(timer);
        return;
      }

      // SCENARIO 1: "Send message to" dialog popup
      const dialog = document.querySelector('div[role="dialog"], div[data-animate-modal-popup="true"]');
      if (dialog) {
        console.log('[DisasterMgmt Extension] "Send message to" dialog detected!');

        // Check if Send button inside dialog is already visible and enabled (means contact was selected)
        const dialogSendBtn = dialog.querySelector(
          'button[aria-label="Send"], span[data-icon="send"], button span[data-icon="send"]'
        )?.closest('button');

        if (dialogSendBtn) {
          console.log('[DisasterMgmt Extension] Send button found in dialog! Clicking send...');
          sent = true;
          dialogSendBtn.click();
          clearInterval(timer);

          setTimeout(() => {
            console.log('[DisasterMgmt Extension] Message sent. Returning to DisasterMgmt Dashboard...');
            try {
              chrome.runtime.sendMessage({ action: 'SWITCH_TO_DASHBOARD' });
            } catch {
              window.location.href = 'https://disastermgmt-chi.vercel.app/';
            }
          }, 2000);
          return;
        }

        // Search contact in dialog list
        const cleanTarget = targetName.toLowerCase();
        let targetRow = null;

        // Try finding span or title matching target
        const allSpans = dialog.querySelectorAll('span[title], div[title], span, p');
        for (const el of allSpans) {
          const title = (el.getAttribute('title') || '').toLowerCase();
          const text = (el.textContent || '').trim().toLowerCase();
          if (
            (title.length > 0 && title.includes(cleanTarget)) ||
            (text.length > 0 && text.includes(cleanTarget) && el.children.length === 0)
          ) {
            targetRow = el.closest('div[role="button"]') || el.closest('div[role="listitem"]') || el.parentElement;
            break;
          }
        }

        if (targetRow) {
          console.log('[DisasterMgmt Extension] Found contact in dialog. Selecting it:', targetRow);
          targetRow.click();

          // Wait 600ms for green send button to appear in bottom-right of dialog
          setTimeout(() => {
            const btn = dialog.querySelector(
              'button[aria-label="Send"], span[data-icon="send"], button span[data-icon="send"]'
            )?.closest('button');
            if (btn) {
              console.log('[DisasterMgmt Extension] Green send button appeared! Clicking...');
              sent = true;
              btn.click();
              clearInterval(timer);

              setTimeout(() => {
                try {
                  chrome.runtime.sendMessage({ action: 'SWITCH_TO_DASHBOARD' });
                } catch {
                  window.location.href = 'https://disastermgmt-chi.vercel.app/';
                }
              }, 2000);
            }
          }, 700);
          return;
        }

        // If not in visible recent chats, type in search box inside dialog
        const modalSearch = dialog.querySelector(
          'input[placeholder*="Search"], input[placeholder*="search"], input[type="text"]'
        );
        if (modalSearch && modalSearch.value !== targetName) {
          console.log('[DisasterMgmt Extension] Typing target into modal search bar:', targetName);
          modalSearch.focus();
          modalSearch.value = targetName;
          modalSearch.dispatchEvent(new Event('input', { bubbles: true }));
          modalSearch.dispatchEvent(new Event('change', { bubbles: true }));
          return;
        }
      }

      // SCENARIO 2: Regular open chat compose footer
      const mainSendBtn = document.querySelector(
        'footer button[aria-label="Send"], footer span[data-icon="send"]'
      )?.closest('button');
      const composeBox = document.querySelector(
        'footer div[contenteditable="true"], div[contenteditable="true"][data-tab="10"]'
      );

      if (mainSendBtn) {
        console.log('[DisasterMgmt Extension] Main send button found! Clicking...');
        sent = true;
        mainSendBtn.click();
        clearInterval(timer);

        setTimeout(() => {
          try {
            chrome.runtime.sendMessage({ action: 'SWITCH_TO_DASHBOARD' });
          } catch {
            window.location.href = 'https://disastermgmt-chi.vercel.app/';
          }
        }, 2000);
        return;
      } else if (composeBox && composeBox.textContent.trim().length > 0) {
        console.log('[DisasterMgmt Extension] Dispatching Enter key on compose box...');
        sent = true;
        composeBox.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true })
        );
        clearInterval(timer);

        setTimeout(() => {
          try {
            chrome.runtime.sendMessage({ action: 'SWITCH_TO_DASHBOARD' });
          } catch {
            window.location.href = 'https://disastermgmt-chi.vercel.app/';
          }
        }, 2000);
        return;
      }

      if (attempts >= maxAttempts) {
        clearInterval(timer);
        console.log('[DisasterMgmt Extension] Auto-send observation window finished.');
      }
    }, 500);
  }
})();
