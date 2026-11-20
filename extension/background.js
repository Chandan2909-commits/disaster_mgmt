// Background service worker
chrome.runtime.onInstalled.addListener(() => {
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
        // Optionally close WhatsApp tab if requested
        if (request.closeWhatsapp && sender.tab && sender.tab.id) {
          chrome.tabs.remove(sender.tab.id);
        }
      } else {
        chrome.tabs.create({ url: 'https://disastermgmt-chi.vercel.app/' });
      }
    });
  }
});
