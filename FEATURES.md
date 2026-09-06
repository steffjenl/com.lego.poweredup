# Feature backlog

Priority reflects value toward the main use case: reliable, unattended automation (e.g. "run the Christmas train on a schedule").

## P1 — Automation (Flow cards)

- [x] **Action: run motor for a duration** — `run_for_duration` (port, power %, duration in seconds; sets power, waits, then brakes). Direct enabler for "let the train drive automatically".
- [x] **Action: set motor power** — `set_power` (port, absolute power -100..100%).
- [x] **Action: brake / stop** — `brake` (port).
- [x] **Trigger: hub connected** / **Trigger: hub disconnected** — `hub_connected`/`hub_disconnected`, fired on actual connection-state transitions (see `device.js` `_setConnectedState`).
- [x] **Condition: hub is connected** — `hub_is_connected`.

Defined in `drivers/poweredup-hub/driver.flow.compose.json`, run listeners registered in `driver.js`. Not verified against a real hub/the Homey Flow editor in this environment — see `SPEC.md`/this repo's dev notes for the manual check to run.

## P2 — Device/driver coverage

- [x] **Connection status capability** — new `connected` read-only capability (`.homeycompose/capabilities/connected.json`), updated on every connection-state transition.
- [ ] **Support additional Powered Up hub types** (Move Hub, Technic Hub, City Hub, Train Hub, Remote Control) as distinct drivers or a capability-driven single driver, since they differ in available ports and sensors. Today everything pairs as one generic "Powered Up Hub". **Deferred**: needs the LEGO "Hub Attached I/O" protocol messages (hub/port type identification) decoded correctly per hub — not safe to hand-write without a real hub to verify against.
- [ ] **Activate ports C and D** for hubs that expose more than 2 motor ports (e.g. Technic Hub). **Deferred**: depends on the hub-type detection above, so a device knows whether it actually has a port C/D before exposing controls for it.
- [ ] **Sensor support**: tilt sensor (Move Hub), color/distance sensor, battery level — exposed over the same LEGO Wireless Protocol via port-mode subscription messages, currently not read at all. **Deferred**: same reason — needs real-hardware verification of the mode/value decoding per sensor type before shipping.

## P3 — Polish

- [x] Real README with setup/usage instructions.
- [x] CHANGELOG.md.
- [x] Basic test coverage — `npm test` (Node's built-in test runner, zero extra dependencies): `mapPower` and `setPower()`'s message construction/characteristic caching, all without live hardware.
- [x] CI — `.github/workflows/ci.yml` runs lint + tests on push/PR.
- [x] Resolve the dead `port` setting / `power_port_c` / `power_port_d` cleanup items — done in `BUGS.md`.
- [ ] `locales/en.json` is still empty — see `BUGS.md` open items.
