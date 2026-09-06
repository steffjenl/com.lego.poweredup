# Changelog

## Unreleased

### Fixed

- Hub connections are now detected and repaired when they drop. Previously the app never noticed a lost Bluetooth connection and would never reconnect until the device was removed and re-paired.
- Discovery no longer throws inside its periodic interval when a scan fails transiently.
- Deleting a device no longer throws when it had never connected.
- Connection failures are now surfaced as "unavailable" in the Homey UI instead of being silent.
- Fixed `power_port_a` and `power_port_b` sharing a single internal power counter, which meant adjusting one port's power could corrupt the other's tracked value.
- `setPower()` now writes to the correct LEGO characteristic directly instead of every characteristic on the service, and caches it instead of rediscovering it on every single command.
- Removed the "Default port" device setting, which had no effect (the code that would have read it was never called).

### Added

- Flow actions: Set power, Run for a duration, Brake.
- Flow condition: Hub is/isn't connected.
- Flow triggers: Hub connected, Hub disconnected.
- `Connected` capability showing live Bluetooth connection state on the device tile.
- Unit tests (`npm test`) and a CI workflow.

### Removed

- Unused `power_port_c` / `power_port_d` capabilities (never wired up to any driver/device — see FEATURES.md for the real "activate ports C/D" work).
