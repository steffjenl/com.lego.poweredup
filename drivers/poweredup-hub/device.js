// @ts-ignore

'use strict';

const {Device} = require('homey');
const {
    BTL_POWERED_UP_HUB_HEALTHCHECK_INTERVAL,
} = require('../../lib/const');
const {mapPower} = require('../../lib/utils');
const {setPower} = require('../../lib/poweredup');

class PoweredUpHubDevice extends Device {

    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        this.advertisement = null;
        this.peripheral = null;

        this.ensureConnected = this.ensureConnected.bind(this);
        this.onSyncInterval = setInterval(this.ensureConnected, BTL_POWERED_UP_HUB_HEALTHCHECK_INTERVAL);
        this.ensureConnected();// do an initial connect

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

        this.registerCapabilityListener('connect', async (value) => {
            this.log(`connecting to ${this.getName()}`);
            await this.ensureConnected();
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
     * onUninit is called when the app is shutting down/restarting.
     */
    async onUninit() {
        if (this.onSyncInterval) {
            clearInterval(this.onSyncInterval);
        }
        if (this.peripheral && this.peripheral.isConnected) {
            await this.peripheral.disconnect().catch(this.error);
        }
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted() {
        if (this.onSyncInterval) {
            clearInterval(this.onSyncInterval);
        }
        if (this.peripheral && this.peripheral.isConnected) {
            try {
                await this.peripheral.disconnect();
            } catch (error) {
                this.error(error);
            }
        }
        this.log('PoweredUpHubDevice has been deleted');
    }

    /**
     * Make sure the device has a live BLE connection, reconnecting if it was
     * lost. Called on an interval, on app init, and via the 'connect' capability.
     * @returns {Promise<void>}
     */
    async ensureConnected() {
        const {uuid} = this.getData();

        try {
            if (!this.advertisement) {
                this.advertisement = await this.homey.ble.find(uuid);
                this.log(`Device ${this.advertisement.localName} found!`);
            }

            if (!this.peripheral) {
                this.peripheral = await this.advertisement.connect();
                this.peripheral.on('disconnect', () => {
                    this.log('Peripheral disconnected');
                    this.setUnavailable('Disconnected from hub').catch(this.error);
                    this.ensureConnected().catch(this.error);
                });
                this.log('Connected to peripheral');
            } else if (!this.peripheral.isConnected) {
                await this.peripheral.connect();
                this.log('Reconnected to peripheral');
            } else {
                await this.peripheral.updateRssi();
            }

            await this.setAvailable().catch(this.error);
        } catch (error) {
            this.error(`Sync failed: ${error.message}`);
            this.advertisement = null;
            await this.setUnavailable(error.message).catch(this.error);
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

        if (!this.hasCapability('connect')) {
            this.addCapability('connect');
            this.homey.log(`created capability connect for ${this.getName()}`);
        }
    }

}

module.exports = PoweredUpHubDevice;
