'use strict';

const {
  BTL_POWERED_UP_HUB_SERVICE_UUID,
  BTL_POWERED_UP_HUB_CHARACTERISTIC_UUID,
} = require('./const');

/**
 * Get the LEGO power characteristic for a peripheral, discovering and
 * caching it on the peripheral the first time it's needed.
 * @param peripheral
 * @returns {Promise<*>}
 */
async function getPowerCharacteristic(peripheral) {
  if (!peripheral._powerCharacteristic) {
    const service = await peripheral.getService(BTL_POWERED_UP_HUB_SERVICE_UUID);
    const characteristics = await service.discoverCharacteristics();
    peripheral._powerCharacteristic = characteristics
      .find((characteristic) => characteristic.uuid === BTL_POWERED_UP_HUB_CHARACTERISTIC_UUID)
            || characteristics[0];
  }
  return peripheral._powerCharacteristic;
}

module.exports = {
  /**
     * Set the power
     * @param peripheral
     * @param port
     * @param power
     * @returns {Promise<void>}
     */
  async setPower(peripheral, port, power) {
    if (!peripheral) {
      return;
    }

    // message
    let message = Buffer.concat([
      Buffer.from([0x81]),
      port,
      Buffer.from([0x11, 0x51, 0x00]),
      Buffer.from([power]),
    ]);
    // generate checksum
    message = Buffer.concat([Buffer.alloc(2), message]);
    message[0] = message.length;

    const characteristic = await getPowerCharacteristic(peripheral);
    try {
      await characteristic.write(message);
    } catch (error) {
      // cached characteristic handle may have gone stale across a reconnect, retry once
      peripheral._powerCharacteristic = null;
      const freshCharacteristic = await getPowerCharacteristic(peripheral);
      await freshCharacteristic.write(message);
    }
  },
};
