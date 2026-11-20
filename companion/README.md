# DisasterMgmt — Local Selenium Companion Agent

This companion service runs locally on the researcher's machine at `http://127.0.0.1:8765`.

## Why is this separate?
The main Disaster Management Dashboard frontend is designed to be hosted seamlessly on **Vercel** or any static host. Because serverless runtimes cannot control a local user's browser via Selenium, this optional local agent acts as the companion bridge.

## Strict Safety Guardrails
As mandated by the research paper (*A Localized Hierarchical Agent Harness for Automated Flood Monitoring, Warning, and Resource Dispatch*):
1. **Loopback only**: Binds strictly to `127.0.0.1`.
2. **Never sends messages**: Opens WhatsApp Web, navigates to the preconfigured research test chat (`disaster_mgmt_research_paper`), and types the draft message labeled `[SIMULATION — NOT SENT]`.
3. **No send click**: The script strictly halts before clicking Send.
4. **Fallback**: If the companion is not running, the dashboard falls back to a high-fidelity in-browser simulation console automatically.

## Quick Start
```bash
cd companion
pip install -r requirements.txt
python agent.py
```
Or double-click `run_agent.bat` on Windows.
