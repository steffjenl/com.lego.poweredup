'use strict';
const {
    BTL_POWERED_UP_HUB_SERVICE_UUID,
} = require('./const');

module.exports = {
    /**
     * Set the power
     * @param peripheral
     * @param port
     * @param power
     * @returns {Promise<void>}
     */
    async setPower(peripheral,port,power) {
        if (peripheral) {
            const service = await peripheral.getService(BTL_POWERED_UP_HUB_SERVICE_UUID);
            const characteristics = await service.discoverCharacteristics();
            for (const characteristic of characteristics) {
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
                // send bluetooth message
                await characteristic.write(message);
            }
        }
    }
}
