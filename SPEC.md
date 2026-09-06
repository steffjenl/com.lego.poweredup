# LEGO Powered Up — Homey App Specification

## Purpose

Homey app (`com.lego.poweredup`) that lets Homey control LEGO Powered Up hubs (e.g. the train motor hub) over Bluetooth Low Energy, so their motors can be driven from Homey's UI and from Homey Flow automations — e.g. running a Christmas train on a schedule.

- Homey SDK: 3 (`compatibility: >=5.0.0`)
- Permissions: `homey:wireless:ble`
- Runtime dependencies: none — the app talks the LEGO Wireless Protocol directly over Homey's built-in `homey.ble` API rather than using a third-party library such as `node-poweredup`.

## Architecture

```
drivers/poweredup-hub/
  driver.js      BLE discovery of nearby hubs, pairing list, Flow action/condition run listeners
  device.js      Per-device connection lifecycle + capability + Flow trigger handling
  driver.compose.json / driver.flow.compose.json
lib/
  const.js       LEGO protocol UUIDs, intervals
  poweredup.js   setPower() — writes a motor-power command over BLE
  utils.js       mapPower() — clamps/maps UI power values to protocol bytes
```

### Driver: discovery (`driver.js`)

On init, and every `BTL_POWERED_UP_HUB_BTL_DISCOVER_INTERVAL` (1 minute), the driver calls `homey.ble.discover([SERVICE_UUID])` and caches any newly seen advertisement by BLE address in `this.advertisements`. Pairing (`onPairListDevices`) lists whatever has been discovered so far. Pairing is `singular: true` (one device per pairing session).

### Device: connection lifecycle (`device.js`)

Each device holds:
- `this.advertisement` — the BLE advertisement for its `uuid`, fetched once via `homey.ble.find(uuid)` and cached.
- `this.peripheral` — the connected `BlePeripheral`, once established.

`ensureConnected()` runs on device init, on an interval (`BTL_POWERED_UP_HUB_HEALTHCHECK_INTERVAL`, 1 minute), and when the user taps the `connect` capability button. On each run it:
1. Finds the advertisement if not cached.
2. Connects if there's no peripheral yet, and registers a `disconnect` listener on it (best-effort fast path — Homey's `disconnect` event is not guaranteed to fire on every drop).
3. If the peripheral exists but `isConnected` is false, calls `peripheral.connect()` again — this resumes the same peripheral object rather than requiring a fresh advertisement/re-pair.
4. If connected, calls `peripheral.updateRssi()` as a cheap liveness probe, so a connection that has silently died is still detected within one interval even if no `disconnect` event fires.
5. Marks the device available/unavailable in the Homey UI to reflect the outcome, and — only on an actual connected/disconnected *transition* — updates the `connected` capability and fires the `hub_connected`/`hub_disconnected` Flow trigger cards (`_setConnectedState()`).

The connection is held persistently (not connect-per-command) — since Homey 6.0, BLE peripherals no longer auto-disconnect after 60s of inactivity, so this is the correct model for a device that must react to Flow actions at any time.

`onUninit()`/`onDeleted()` clear the health-check interval and disconnect the peripheral if still connected, to avoid orphaned BLE connections surviving an app restart or device removal.

### Sending commands (`lib/poweredup.js`)

`setPower(peripheral, port, power)` looks up the LEGO service on the peripheral, discovers its characteristics once, and caches the one matching `BTL_POWERED_UP_HUB_CHARACTERISTIC_UUID` on the peripheral object. It writes a LEGO Wireless Protocol "Port Output Command" message (`0x81 <port> 0x11 0x51 0x00 <power>`, length-prefixed) to that characteristic; if the write fails (e.g. a stale handle after a reconnect), the cache is cleared and rediscovered once, then retried.

`device.js` exposes `setPortPower(portKey, power)` (absolute power, clamped via `mapPower`) and `brakePort(portKey)` as the shared entry points used by both the UI capability listeners and the Flow action run listeners, with power tracked per port (`this.currentPower = { a, b }`).

### Capabilities

- `power_port_a`, `power_port_b` — ternary (`up`/`down`/`break`) buttons that step the per-port `currentPower` value by ±10 per tap (clamped to [-100, 100] by `mapPower`), or send the LEGO "brake" sentinel (`127`) on `break`. Each capability is hardcoded to port A (`0x00`) or B (`0x01`) respectively.
- `connect` — manual button to force an immediate `ensureConnected()` call.
- `connected` — read-only indicator reflecting the live Bluetooth connection state.

### Flow cards (`driver.flow.compose.json`)

- **Actions**: `set_power` (port, absolute power %), `run_for_duration` (port, power %, duration in seconds — sets power, waits, then brakes), `brake` (port). Run listeners registered in `driver.js`, delegating to the device methods above.
- **Condition**: `hub_is_connected`.
- **Triggers**: `hub_connected`, `hub_disconnected` — fired by `device.js` on connection-state transitions, not on every health-check tick.

### Pairing data

Each paired device stores `{ address, uuid }` from its advertisement; `uuid` is what `homey.ble.find()` uses to relocate the peripheral on every reconnect attempt.

## Current limitations

- **One generic driver** for all Powered Up hubs — no distinction between Move Hub, Technic Hub, City Hub, Train Hub, or Remote Control, and no support for anything beyond 2 fixed motor ports (no ports C/D).
- **No sensor support** — tilt, color/distance, and battery-level data that some hubs expose over the same protocol isn't read.
- Motor power is tracked only in local device state (`currentPower`), not read back from the hub, so it can drift from the hub's actual state (e.g. after an app restart).
- See `BUGS.md` and `FEATURES.md` for the itemized backlog.
