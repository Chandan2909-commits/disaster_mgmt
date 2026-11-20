// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('[DisasterMgmt Extension] Installed successfully.');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SWITCH_TO_DASHBOARD') {
    chrome.tabs.query({}, (tabs) => {
      // Find the dashboard tab (on Vercel or local)
      const dashTab = tabs.find(
        (t) => t.url && (t.url.includes('disastermgmt') || t.url.includes('localhost:3000'))
      );

      if (dashTab && dashTab.id) {
        // Switch to the dashboard tab
        chrome.tabs.update(dashTab.id, { active: true }, () => {
          if (sender.tab && sender.tab.id && sender.tab.id !== dashTab.id) {
            chrome.tabs.remove(sender.tab.id);
          }
        });
      } else {
        // Open the dashboard tab if closed
        chrome.tabs.create({ url: 'https://disastermgmt-chi.vercel.app/' }, () => {
          if (sender.tab && sender.tab.id) {
            chrome.tabs.remove(sender.tab.id);
          }
        });
      }
    });
  }
});
