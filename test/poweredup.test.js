'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const {setPower} = require('../lib/poweredup');
const {BTL_POWERED_UP_HUB_CHARACTERISTIC_UUID} = require('../lib/const');

/**
 * Mock BlePeripheral: records every discoverCharacteristics/write call so
 * tests can assert on caching and retry behaviour without real BLE.
 */
function createMockPeripheral({failFirstWrite = false} = {}) {
    const writes = [];
    let getServiceCalls = 0;
    let writeAttempts = 0;

    const characteristic = {
        uuid: BTL_POWERED_UP_HUB_CHARACTERISTIC_UUID,
        write: async (message) => {
            writeAttempts += 1;
            if (failFirstWrite && writeAttempts === 1) {
                throw new Error('stale characteristic handle');
            }
            writes.push(message);
        },
    };

    return {
        writes,
        get getServiceCalls() {
            return getServiceCalls;
        },
        getService: async () => {
            getServiceCalls += 1;
            return {
                discoverCharacteristics: async () => [characteristic],
            };
        },
    };
}

test('setPower does nothing when there is no peripheral', async () => {
    await assert.doesNotReject(setPower(null, Buffer.from([0x00]), 50));
});

test('setPower writes a length-prefixed LEGO port-output message', async () => {
    const peripheral = createMockPeripheral();

    await setPower(peripheral, Buffer.from([0x00]), 50);

    assert.equal(peripheral.writes.length, 1);
    assert.deepEqual(
        [...peripheral.writes[0]],
        [8, 0, 0x81, 0x00, 0x11, 0x51, 0x00, 50],
    );
});

test('setPower encodes negative power as a two\'s-complement byte', async () => {
    const peripheral = createMockPeripheral();

    await setPower(peripheral, Buffer.from([0x01]), -50);

    assert.deepEqual(
        [...peripheral.writes[0]],
        [8, 0, 0x81, 0x01, 0x11, 0x51, 0x00, 206],
    );
});

test('setPower discovers the characteristic once and reuses it on subsequent calls', async () => {
    const peripheral = createMockPeripheral();

    await setPower(peripheral, Buffer.from([0x00]), 10);
    await setPower(peripheral, Buffer.from([0x00]), 20);

    assert.equal(peripheral.getServiceCalls, 1);
    assert.equal(peripheral.writes.length, 2);
});

test('setPower rediscovers and retries once if the cached characteristic write fails', async () => {
    const peripheral = createMockPeripheral({failFirstWrite: true});

    await setPower(peripheral, Buffer.from([0x00]), 30);

    assert.equal(peripheral.getServiceCalls, 2);
    assert.equal(peripheral.writes.length, 1);
});
