async function checkAgent() {
  const statusEl = document.getElementById('agent-status');
  try {
    const res = await fetch('http://127.0.0.1:8765/health', { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      statusEl.innerHTML = '<span class="dot green"></span> Online (Port 8765)';
    } else {
      statusEl.innerHTML = '<span class="dot amber"></span> Standby';
    }
  } catch (e) {
    statusEl.innerHTML = '<span class="dot amber"></span> Standby (Mock Mode)';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkAgent();
  document.getElementById('check-btn').addEventListener('click', checkAgent);
});
