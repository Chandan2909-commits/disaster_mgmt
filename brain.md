# BRAIN.md — Flood Monitoring & Disaster Warning Simulation Prototype

## 1. Mission
Build a simple, polished, interactive **flood monitoring and disaster warning simulation** based on the research paper:

> *A Localized Hierarchical Agent Harness for Automated Flood Monitoring, Warning, and Resource Dispatch*

This is a prototype for demonstration and research—not a real flood-monitoring service. It uses simulated telemetry and must not connect to real sensors, trigger emergency services, or transmit real public warnings. The UI styling and layout are specified separately in `design.md`; read and follow that file for visual decisions. Do not recreate or override its design system unnecessarily.


## 2. Prototype goals
- Display a dashboard with simulated river/sensor telemetry and derived flood-risk metrics.
- Continuously update dashboard values and timestamps in real time while simulation is running.
- Allow the operator to open a water-level graph simulator, drag its curve/points, and set a new water-level profile.
- Immediately recalculate dashboard values when a new simulated water level is applied.
- Detect simulated warning/critical conditions and show an alert.
- Start a **30-second human cancellation window** for a generated alert.
- If cancelled within 30 seconds, stop the pending simulation action and log the cancellation.
- If the timer expires without human input, proceed to a **mock notification workflow only**.
- Use Selenium through a separate local agent/extension-style companion, while the frontend remains deployable on Vercel.

## 3. Non-goals and safety boundaries
- No physical sensor connection or real sensor ingestion.
- No actual SMS, calls, sirens, dispatches, evacuations, or emergency-service integrations.
- No real emergency broadcast or WhatsApp message transmission.
- Do not automate clicking the WhatsApp **Send** button. Selenium may open WhatsApp Web, navigate to the configured research chat, and prepare/display a clearly marked test message, but it must stop before transmission. Prefer a mock WhatsApp panel when browser automation is unavailable.
- Clearly label simulated data and test notifications throughout the UI. Never present simulation output as verified real-world information.
- All actions must be reversible/resettable, and simulation state should be obvious.

## 4. Core application flow
1. Dashboard loads with a seeded simulated river state and a visible `SIMULATION` status.
2. Telemetry values update periodically using deterministic or bounded random changes. Keep noise believable and avoid unbounded random jumps.
3. Operator clicks **Water Level Simulator** in the left sidebar.
4. A modal opens with an editable time-series graph.
5. Operator drags graph control points to create a rising, falling, stable, or sudden-change water-level curve.
6. Clicking **Set Water Level** commits the selected simulated profile and closes the modal.
7. The dashboard updates immediately: current level, trend/rate, threat score, status, estimated time to danger, rainfall/sensor context, and event history.
8. If the newly evaluated state crosses the configured warning/critical rule, create a pending simulated alert and show the alert modal.
9. Start a 30-second countdown. Operator can cancel; cancellation stops the mock notification sequence and is recorded.
10. If the countdown reaches zero, mark the alert as timed out and run the mock Selenium notification workflow. This workflow may prepare a test message in the research chat but must never send it.
11. Show the final status and event log on the dashboard.

## 5. Dashboard metrics
Show these metrics, with units and clear labels:

- Current river water level (m)
- Warning threshold (m)
- Danger threshold (m)
- Water-level rate of change (m/hour)
- Local rainfall rate (mm/hour)
- Accumulated rainfall (mm)
- Turbidity (NTU or a clearly marked simulated unit)
- Acoustic anomaly indicator/score
- Flood Threat Score (normalized or displayed as a score)
- Threat state: `NORMAL`, `WATCH`, `WARNING`, `CRITICAL`
- Estimated Time-to-Inundation / Time-to-Danger (minutes)
- Population potentially affected (simulated estimate)
- Sensor health: `HEALTHY`, `NOISY`, `DEGRADED`
- Last telemetry update time
- Pending alert status/countdown, when applicable
- Simulation event log / audit trail

Use realistic-looking but explicitly synthetic initial values. Make thresholds configurable in a simulation settings area. Do not imply values represent any real river, district, gauge, or population.

## 6. Threat assessment logic
Use transparent, deterministic rules for this prototype. Do not depend on an LLM for the core threshold decision.

### Suggested status rules (make thresholds configurable)
- `NORMAL`: water level below warning threshold and no strong anomaly.
- `WATCH`: approaching warning level, rising trend, rainfall, or sensor anomaly.
- `WARNING`: water level at/above warning threshold, or risk score crosses the configured warning score.
- `CRITICAL`: water level at/above danger threshold, or a configurable critical risk rule is met.

Display the exact reason(s) that produced the status. Avoid a black-box status badge.

### Paper-inspired Threat Score
The paper describes a Threat Score using water level relative to warning/danger levels, rate of change, and population exposure. Implement a simplified, normalized prototype version with adjustable weights:

`ThreatScore = α × LevelRisk + β × RiseRisk + γ × PopulationRisk`

- `α + β + γ = 1`
- `LevelRisk` increases as water level approaches the danger threshold.
- `RiseRisk` increases with positive rate of change; a sudden fall can also be displayed as a separate blockage/anomaly signal rather than treated as safe.
- `PopulationRisk` is a synthetic exposure value between 0 and 1.

The paper's formulation uses the water level relative to warning/danger thresholds, change rate, and population density. The prototype may simplify normalization, but explain the score components in a tooltip or details panel and label it as a simulation score.

### Time-to-Danger estimate
Use a simple linear estimate only when the level is rising and the rate is positive:

`TTD (minutes) = (DangerLevel − CurrentLevel) / RiseRate × 60`

Clamp invalid/negative values and show `N/A` or `Already at danger level` as appropriate. Add a visible note that this is a simplified linear simulation, not a hydrological forecast. The paper calls its corresponding metric Time-to-Inundation (TTI) and includes a geographic delay coefficient; this prototype does not model geographic wave propagation.

## 7. Water-level simulator modal
- Entry point: left sidebar item labelled `Water Level Simulator`.
- Modal graph must be interactive, not a static image.
- X-axis: simulated time (minutes or hours, clearly stated).
- Y-axis: water level (metres).
- Show warning and danger thresholds as horizontal reference lines.
- Provide draggable curve control points or graph points. Users should be able to shape the curve to model a gradual rise, spike, fall, or stable state.
- Constrain the graph to a sensible configurable range; prevent invalid negative water levels.
- Show the current selected level/profile preview.
- Controls: `Reset Curve`, `Set Water Level`, and `Close`.
- On `Set Water Level`, commit the profile and immediately update the dashboard and telemetry history. Recalculate rate from the simulated profile/time interval, rather than arbitrarily inventing a rate.
- Keep the modal responsive and usable on smaller screens.

## 8. Alert modal and human gate
- Alerts are simulation events only and must have a prominent `SIMULATION ALERT` label.
- Show the detected threat, current water level, warning/danger thresholds, threat score, trend, sensor context, and reason for alert.
- Start a 30-second countdown upon alert creation.
- Primary operator action: `Cancel Alert` (or `Dismiss / Cancel Simulation Action`).
- Allow an optional cancellation reason.
- Cancellation must stop the timer and prevent the mock notification workflow from running.
- If no input is received by the end of 30 seconds, log `HUMAN REVIEW TIMEOUT` and run only the mock notification workflow.
- Avoid wording that suggests an actual public alert has been approved or transmitted.
- Make duplicate alerts manageable: do not create repeated countdown modals every telemetry tick. Use one pending alert per incident and allow a new alert only after the state is resolved or meaningfully changes.

## 9. Mock notification and Selenium companion
### Frontend
- Show a communication/notification console that records the generated test message and workflow stages.
- Message must include a clear prefix such as `[SIMULATION — NOT SENT]`.
- Show destination label as `disaster_mgmt_research_paper` for the demo configuration, but make it configurable.
- Show states such as `QUEUED`, `LOCAL AGENT CONNECTED`, `BROWSER OPENED`, `CHAT FOUND`, `TEST MESSAGE PREPARED`, and `NOT SENT — SIMULATION COMPLETE`.
- If the local Selenium agent is unavailable, fall back to a fully simulated workflow in the dashboard. The prototype must remain usable without Selenium.

### Local Selenium agent / extension-style companion
The frontend is hosted on Vercel; Selenium cannot execute in Vercel's browser runtime. Build a small local Python companion that runs on the operator's computer and exposes a restricted localhost interface (or WebSocket) for prototype commands. Treat it as a local browser automation companion/extension in the product UX; it is a separate process, not code bundled into the Vercel deployment.

Suggested local interface:
- `GET /health` — return local agent status/version.
- `POST /simulation/prepare-message` — accept a typed simulation payload and prepare a test message.
- Optional WebSocket channel for status updates.

Security/implementation requirements:
- Bind to loopback only (`127.0.0.1`), never `0.0.0.0`.
- Validate payloads with a typed schema; reject unknown or malformed fields.
- Allow only the simulation workflow commands; no arbitrary shell, arbitrary URL, arbitrary JavaScript, or generic browser-control endpoint.
- Restrict browser navigation to the WhatsApp Web origin for this demo.
- Use an explicit, fixed destination chat label/allowlist for the demo; don't accept arbitrary destinations from frontend input in the prototype.
- Apply localhost CORS narrowly to the known frontend origin(s); do not use wildcard CORS with credentials.
- Do not persist WhatsApp credentials, session cookies, or message content. Selenium should use the user's already-authenticated local browser profile only if the user explicitly configures it; never export session data.
- Browser automation may open WhatsApp Web and locate the named research chat, then prepare a clearly marked test message in the compose box. **It must not press Send, submit the message, or transmit it.**
- Show browser automation progress and errors without exposing cookies or personal data.
- If the target chat is not found or WhatsApp is not logged in, report a clear failure and return to mock mode.
- Use explicit waits; avoid brittle fixed sleeps wherever possible. Keep selectors isolated in one module and resilient to UI changes.
- Provide a stop/cleanup command and close only browser resources created by the agent.

### Test-message template
`[SIMULATION — NOT SENT] Flood monitoring demo: simulated river level is {level} m; threat status is {status}; threat score is {score}; trend is {trend}. This is a research prototype and not a real emergency warning.`

## 10. State model and events
Use a single well-defined simulation state, with a clear source of truth. Suggested state:
- `simulationRunning`
- `telemetry`
- `thresholds`
- `threatScore`
- `threatStatus`
- `timeToDanger`
- `sensorHealth`
- `activeIncidentId`
- `pendingAlert`
- `countdownRemaining`
- `alertDecision`
- `notificationWorkflowStatus`
- `eventLog[]`

Suggested event types:
- `SIMULATION_STARTED`
- `TELEMETRY_UPDATED`
- `WATER_LEVEL_PROFILE_SET`
- `THREAT_STATUS_CHANGED`
- `SIMULATION_ALERT_CREATED`
- `ALERT_CANCELLED_BY_OPERATOR`
- `HUMAN_REVIEW_TIMEOUT`
- `MOCK_NOTIFICATION_STARTED`
- `LOCAL_AGENT_CONNECTED`
- `BROWSER_OPENED`
- `CHAT_LOCATED`
- `TEST_MESSAGE_PREPARED`
- `SIMULATION_MESSAGE_NOT_SENT`
- `LOCAL_AGENT_FAILED`
- `SIMULATION_RESET`

Every event should have a timestamp, type, concise description, and relevant safe metadata. Event log should be chronological and visually distinguish cancellation, timeout, and agent failures.

## 11. Real-time behavior
- Use frontend simulation state and timers for the prototype; no cloud database is required initially.
- Update telemetry at a controlled interval (e.g. every 1–2 seconds), but avoid jittering every metric independently in a way that looks unrealistic.
- Use a stable seed or bounded noise so the demo is repeatable.
- Make simulation pause/resume and reset available.
- `Set Water Level` should update state immediately, then the next tick should continue from the newly set state/profile.
- Ensure all timers are cleaned up when components unmount or the simulation is reset.
- Avoid duplicate countdowns or stale event handlers.

## 12. Suggested implementation structure
Keep the project simple and modular. Adjust names to match the existing repository, but avoid unnecessary architecture or overengineering.

Frontend modules may include:
- `Dashboard` — dashboard layout and metric cards.
- `TelemetryStore` or central simulation state — single source of truth.
- `SimulationEngine` — bounded telemetry updates, trend calculations, status, score, and time-to-danger.
- `WaterLevelSimulator` — graph modal, draggable points, profile editing.
- `AlertController` — pending alert, 30-second timer, cancellation, timeout handling.
- `NotificationConsole` — mock message and workflow status.
- `EventLog` — chronological simulation audit trail.
- `LocalAgentClient` — narrow localhost API client with health check, timeout, and fallback to mock mode.

Local companion modules may include:
- `agent_server` — loopback-only API.
- `message_schema` — validation for typed simulation payloads.
- `whatsapp_preview_automation` — Selenium browser flow that opens the fixed test chat and prepares, but never sends, a test message.
- `agent_status` — connection and automation progress.

Do not build a full backend, Redis, database, cloud Selenium grid, authentication service, or deployment pipeline for the initial prototype unless explicitly required later.

## 13. Error handling and demo resilience
- The dashboard must work if Selenium is not installed, the agent is not running, Chrome is unavailable, WhatsApp Web is logged out, or the chat cannot be found.
- Fall back to a local mock workflow and show the reason.
- Validate graph edits and alert state.
- Prevent a reset from leaving a countdown or browser task active.
- Keep a visible `SIMULATION MODE` indicator at all times.
- Make the demo repeatable: provide `Reset Simulation` and predictable scenario presets such as `Stable`, `Gradual Rise`, `Rapid Surge`, `Sudden Drop / Possible Blockage`, and `Sensor Noise`.

## 14. Acceptance checklist
- [ ] Dashboard displays all key simulated telemetry and threat metrics.
- [ ] Metric cards update in real time and show units.
- [ ] Threat status and score are explainable.
- [ ] Water-level simulator opens from the sidebar.
- [ ] Graph points/curve are draggable and thresholds are visible.
- [ ] Setting the curve immediately updates the dashboard.
- [ ] Rise/fall rate and time-to-danger are recalculated correctly.
- [ ] Threshold crossing creates one simulated alert.
- [ ] Alert countdown begins at 30 seconds.
- [ ] Cancel action stops the countdown and mock workflow.
- [ ] Timeout starts a mock notification workflow only.
- [ ] Selenium companion is optional and local-only.
- [ ] Selenium can prepare a simulation message in the configured research chat, but cannot send it.
- [ ] No real emergency notifications or dispatches can occur.
- [ ] Mock mode works without the local companion.
- [ ] Event log records the complete lifecycle.
- [ ] Reset clears pending alerts, timers, and simulation history appropriately.
- [ ] UI follows `design.md`.


## 15. Development instructions for the coding agent
1. Inspect the current repository and read `design.md` before implementing UI.
2. Build the prototype in small, sequential steps; do not rewrite working code unnecessarily.
3. Start with the dashboard and central simulation state.
4. Implement telemetry calculations and scenario presets.
5. Implement the interactive graph modal and apply action.
6. Implement threshold evaluation and the 30-second human gate.
7. Implement the mock notification console and event log.
8. Implement the local Selenium companion as an optional isolated module with strict simulation-only behavior.
9. Connect frontend-to-local-agent communication with clear status and fallback.
10. Run the app, test each scenario, test cancellation and timeout, and fix errors.
11. Verify the app remains functional when the local agent is stopped.
12. Do not claim a real flood prediction, real notification, or message delivery.

Keep this as a compact, presentable research demonstration. Prioritize reliable interactions, understandable metrics, and a smooth demo over unnecessary complexity.
