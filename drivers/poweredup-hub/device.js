// @ts-ignore

'use strict';

const {Device} = require('homey');
const {
    BTL_POWERED_UP_HUB_SYNC_INTERVAL,
} = require('../../lib/const');
const {mapPower} = require('../../lib/utils');
const {setPower} = require('../../lib/poweredup');

class PoweredUpHubDevice extends Device {

    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        this.setAvailable()
            .catch(this.error);
        this.onSync = this.onSync.bind(this);
        this.onSyncInterval = setInterval(this.onSync, BTL_POWERED_UP_HUB_SYNC_INTERVAL);
        this.onSync();// do an initial sync

        this.currentPower = 0;

        this.registerCapabilityListener('power_port_a', async (value) => {
            const portNumber = Buffer.from([0x00]);
            if (value === 'break') {
                this.currentPower = 0;
                await setPower(this.peripheral, portNumber, mapPower(127));
            } else if (value === 'down') {
                this.currentPower -= 10;
                await setPower(this.peripheral, portNumber, mapPower(this.currentPower));
            } else if (value === 'up') {
                this.currentPower += 10;
                await setPower(this.peripheral, portNumber, mapPower(this.currentPower));
            }

            this.log(`set power_port_a to ${this.currentPower} for ${this.getName()}`);
        });

        this.registerCapabilityListener('power_port_b', async (value) => {
            const portNumber = Buffer.from([0x01]);
            if (value === 'break') {
                this.currentPower = 0;
                await setPower(this.peripheral, portNumber, mapPower(127));
            } else if (value === 'down') {
                this.currentPower -= 10;
                await setPower(this.peripheral, portNumber, mapPower(this.currentPower));
            } else if (value === 'up') {
                this.currentPower += 10;
                await setPower(this.peripheral, portNumber, mapPower(this.currentPower));
            }

            this.log(`set power_port_b to ${this.currentPower} for ${this.getName()}`);
        });

        this.registerCapabilityListener('power_port_c', async (value) => {
            const portNumber = Buffer.from([0x02]);
            if (value === 'break') {
                this.currentPower = 0;
                await setPower(this.peripheral, portNumber, mapPower(127));
            } else if (value === 'down') {
                this.currentPower -= 10;
                await setPower(this.peripheral, portNumber, mapPower(this.currentPower));
            } else if (value === 'up') {
                this.currentPower += 10;
                await setPower(this.peripheral, portNumber, mapPower(this.currentPower));
            }

            this.log(`set power_port_c to ${this.currentPower} for ${this.getName()}`);
        });

        this.registerCapabilityListener('power_port_d', async (value) => {
            const portNumber = Buffer.from([0x03]);
            if (value === 'break') {
                this.currentPower = 0;
                await setPower(this.peripheral, portNumber, mapPower(127));
            } else if (value === 'down') {
                this.currentPower -= 10;
                await setPower(this.peripheral, portNumber, mapPower(this.currentPower));
            } else if (value === 'up') {
                this.currentPower += 10;
                await setPower(this.peripheral, portNumber, mapPower(this.currentPower));
            }

            this.log(`set power_port_d to ${this.currentPower} for ${this.getName()}`);
        });

        this.registerCapabilityListener('connect', async (value) => {
            this.log(`connecting to ${this.getName()}`);
            await this.onSync();
        });

        await this._createMissingCapabilities();

        this.log('PoweredUpHubDevice has been initialized');
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded() {
        this.log('PoweredUpHubDevice has been added');
    }

    /**
     * onSettings is called when the user updates the device's settings.
     * @param {object} event the onSettings event data
     * @param {object} event.oldSettings The old settings object
     * @param {object} event.newSettings The new settings object
     * @param {string[]} event.changedKeys An array of keys changed since the previous version
     * @returns {Promise<string|void>} return a custom message that will be displayed
     */
    async onSettings({
                         oldSettings,
                         newSettings,
                         changedKeys,
                     }) {
        this.log('PoweredUpHubDevice settings where changed');
    }

    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name) {
        this.log('PoweredUpHubDevice was renamed');
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted() {
        if (!this.peripheral || this.peripheral.isConnected) {
            try {
                this.peripheral.disconnect();
            } catch (error) {
                this.error(error);
            }
        }
        this.log('PoweredUpHubDevice has been deleted');
    }

    /**
     *  Sync the device
     * @returns {Promise<void>}
     */
    async onSync() {
        this.log('Syncing...');

        this.setAvailable()
            .catch(this.error);

        const {uuid} = this.getData();

        try {
            if (!this.advertisement) {
                this.advertisement = await this.homey.ble.find(uuid);
                this.log(`Device ${this.advertisement.localName} found!`);
            }
            if (this.advertisement && !this.peripheral) {
                this.peripheral = this.advertisement.connect()
                    .then((peripheral) => {
                        this.log('Connected to peripheral');
                        this.peripheral = peripheral;
                        return peripheral;
                    })
                    .catch((error) => {
                        this.error(`Can not connect to peripheral ${this.advertisement.localName}`);
                        return null;
                    });
            }
        } catch (error) {
            this.error(error);
            // await this.setUnavailable(error.message);
        }
    }

    /**
     *  Create missing capabilities
     * @returns {Promise<void>}
     * @private
     */
    async _createMissingCapabilities() {
        if (this.hasCapability('power')) {
            this.removeCapability('power');
            this.homey.log(`removed capability power for ${this.getName()}`);
        }

        if (!this.hasCapability('power_port_a')) {
            this.addCapability('power_port_a');
            this.homey.log(`created capability power_port_a for ${this.getName()}`);
        }

        if (!this.hasCapability('power_port_b')) {
            this.addCapability('power_port_b');
            this.homey.log(`created capability power_port_b for ${this.getName()}`);
        }

        if (!this.hasCapability('power_port_c')) {
            this.addCapability('power_port_c');
            this.homey.log(`created capability power_port_c for ${this.getName()}`);
        }

        if (!this.hasCapability('power_port_d')) {
            this.addCapability('power_port_d');
            this.homey.log(`created capability power_port_d for ${this.getName()}`);
        }

        if (!this.hasCapability('connect')) {
            this.addCapability('connect');
            this.homey.log(`created capability connect for ${this.getName()}`);
        }
    }

    /**
     * Get the default port
     * @returns {Promise<Buffer>}
     */
    async getDefaultPort() {
        const settings = this.getSettings();
        if (settings.port === '1' || settings.port === 1) {
            return Buffer.from([0x00]);
        }
        if (settings.port === '2' || settings.port === 2) {
            return Buffer.from([0x01]);
        }
        return Buffer.from([0x00]);
    }

}

module.exports = PoweredUpHubDevice;
