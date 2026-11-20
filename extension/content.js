// Content script for DisasterMgmt extension
(function() {
  // 1. Mark presence in DOM dataset immediately
  if (document.documentElement) {
    document.documentElement.setAttribute('data-disaster-mgmt-extension', 'active');
    document.documentElement.setAttribute('data-extension-version', '1.0.0');
  }

  // 2. Inject bridge script into the page window context
  const script = document.createElement('script');
  script.textContent = `
    window.__DISASTER_MGMT_EXTENSION__ = {
      version: '1.0.0',
      active: true,
      companionPort: 8765,
      loadedAt: Date.now()
    };
    window.dispatchEvent(new CustomEvent('disaster-mgmt-extension-ready', {
      detail: { version: '1.0.0', active: true }
    }));
  `;
  (document.head || document.documentElement).appendChild(script);
  script.remove();

  // 3. Listen for requests from page
  window.addEventListener('message', async (event) => {
    if (!event.data || event.data.source !== 'disaster-mgmt-web') return;

    if (event.data.type === 'PING_EXTENSION') {
      window.postMessage({
        source: 'disaster-mgmt-extension',
        type: 'PONG_EXTENSION',
        version: '1.0.0',
        active: true
      }, '*');
    }

    if (event.data.type === 'RELAY_TO_COMPANION') {
      try {
        const res = await fetch('http://127.0.0.1:8765' + event.data.endpoint, {
          method: event.data.method || 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: event.data.payload ? JSON.stringify(event.data.payload) : undefined
        });
        const json = await res.json();
        window.postMessage({
          source: 'disaster-mgmt-extension',
          type: 'COMPANION_RESPONSE',
          requestId: event.data.requestId,
          success: true,
          data: json
        }, '*');
      } catch (err) {
        window.postMessage({
          source: 'disaster-mgmt-extension',
          type: 'COMPANION_RESPONSE',
          requestId: event.data.requestId,
          success: false,
          error: err.toString()
        }, '*');
      }
    }
  });
})();
