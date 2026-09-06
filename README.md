# Lego Powered Up

Homey app to control LEGO Powered Up hubs (e.g. train motors) over Bluetooth LE — from the Homey app itself and from Homey Flow.

## Pairing

Add a device via the **Powered Up Hub** driver. The app scans for nearby Powered Up hubs over Bluetooth; put your hub in pairing mode (button flashing) and select it from the list.

## Capabilities

- **Power port A / Power port B** — ternary up/down/brake control per motor port, stepping power by 10% per tap.
- **Connect** — manually force a reconnect attempt.
- **Connected** — read-only indicator of whether the hub currently has a live Bluetooth connection.

## Flow cards

- **Actions**: Set power (absolute, per port), Run for a duration (set power, wait, then brake — e.g. "run the train for 30 seconds"), Brake.
- **Condition**: Hub is/isn't connected.
- **Triggers**: Hub connected, Hub disconnected.

These are enough to build automations like scheduling a train to run automatically (e.g. a time-based Flow trigger → *Run for a duration*), or getting notified when a hub drops its connection.

## Connection behaviour

The app holds a persistent Bluetooth connection to each paired hub and checks it once a minute, reconnecting automatically if it was lost — see [SPEC.md](SPEC.md) for the details.

## Project status

See [SPEC.md](SPEC.md) for the full architecture/state write-up, [BUGS.md](BUGS.md) for known issues, and [FEATURES.md](FEATURES.md) for the backlog (including hub types, extra ports and sensors that aren't supported yet).

## Development

```sh
npm test   # unit tests (Node's built-in test runner, no BLE/hardware needed)
npm run lint
```
