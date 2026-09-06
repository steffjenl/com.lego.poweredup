# Feature backlog

Priority reflects value toward the main use case: reliable, unattended automation (e.g. "run the Christmas train on a schedule").

## P1 — Automation (Flow cards)

None exist today — no `driver.flow.compose.json`, no `flow` section anywhere. Needed for any Homey Flow use case:

- [ ] **Action: run motor for a duration** — e.g. "set port A to 60% for 30 seconds, then stop". This is the direct enabler for "let the train drive automatically" (e.g. a time-based Flow trigger → this action), without needing a `break` action wired in separately.
- [ ] **Action: set motor power** — absolute power/direction, not just the existing relative up/down/brake buttons, so a Flow can set an exact known speed.
- [ ] **Action: brake / stop**.
- [ ] **Trigger: hub connected** / **Trigger: hub disconnected** — lets a Flow react to connection loss (e.g. push a notification), which directly addresses the "I want to know when it drops" side of the reliability complaint.
- [ ] **Condition: hub is connected** — so a Flow can guard other actions on connection state.

## P2 — Device/driver coverage

- [ ] **Support additional Powered Up hub types** (Move Hub, Technic Hub, City Hub, Train Hub, Remote Control) as distinct drivers or a capability-driven single driver, since they differ in available ports and sensors. Today everything pairs as one generic "Powered Up Hub".
- [ ] **Activate ports C and D** (capabilities already exist in `.homeycompose/capabilities/` but are dead — see `BUGS.md`) for hubs that expose more than 2 motor ports (e.g. Technic Hub).
- [ ] **Sensor support**: tilt sensor (Move Hub), color/distance sensor, battery level — exposed over the same LEGO Wireless Protocol, currently not read at all.
- [ ] **Connection status capability** (e.g. a read-only indicator, not just the existing manual `connect` button) so connection state is visible directly on the device tile, not only via available/unavailable.

## P3 — Polish

- [ ] Real README with setup/usage instructions (current one is a one-line placeholder).
- [ ] CHANGELOG.md.
- [ ] Basic test coverage (none exists today — e.g. unit tests for `mapPower`/`setPower` message construction, which don't require live hardware).
- [ ] CI (lint on PR at minimum — no CI config exists today).
- [ ] Resolve the dead `port` setting / `power_port_c` / `power_port_d` cleanup items from `BUGS.md` as part of the multi-port work above, rather than separately.
