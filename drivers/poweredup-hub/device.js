// @ts-ignore

'use strict';

const {Device} = require('homey');
const {
    BTL_POWERED_UP_HUB_HEALTHCHECK_INTERVAL,
} = require('../../lib/const');
const {mapPower} = require('../../lib/utils');
const {setPower} = require('../../lib/poweredup');

const PORT_BYTES = {
    a: Buffer.from([0x00]),
    b: Buffer.from([0x01]),
};

class PoweredUpHubDevice extends Device {

    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        this.advertisement = null;
        this.peripheral = null;
        this.isConnected = false;

        this.ensureConnected = this.ensureConnected.bind(this);
        this.onSyncInterval = setInterval(this.ensureConnected, BTL_POWERED_UP_HUB_HEALTHCHECK_INTERVAL);
        this.ensureConnected();// do an initial connect

        this.currentPower = {a: 0, b: 0};

        this.registerCapabilityListener('power_port_a', async (value) => {
            if (value === 'break') {
                await this.brakePort('a');
            } else if (value === 'down') {
                await this.setPortPower('a', this.currentPower.a - 10);
            } else if (value === 'up') {
                await this.setPortPower('a', this.currentPower.a + 10);
            }

            this.log(`set power_port_a to ${this.currentPower.a} for ${this.getName()}`);
        });

        this.registerCapabilityListener('power_port_b', async (value) => {
            if (value === 'break') {
                await this.brakePort('b');
            } else if (value === 'down') {
                await this.setPortPower('b', this.currentPower.b - 10);
            } else if (value === 'up') {
                await this.setPortPower('b', this.currentPower.b + 10);
            }

            this.log(`set power_port_b to ${this.currentPower.b} for ${this.getName()}`);
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
     * Set the absolute power on a port (-100..100), tracking it per port.
     * @param {'a'|'b'} portKey
     * @param {number} power
     * @returns {Promise<void>}
     */
    async setPortPower(portKey, power) {
        this.currentPower[portKey] = mapPower(Math.round(power));
        await setPower(this.peripheral, PORT_BYTES[portKey], this.currentPower[portKey]);
    }

    /**
     * Brake (stop) a port.
     * @param {'a'|'b'} portKey
     * @returns {Promise<void>}
     */
    async brakePort(portKey) {
        this.currentPower[portKey] = 0;
        await setPower(this.peripheral, PORT_BYTES[portKey], mapPower(127));
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
            await this._setConnectedState(true);
        } catch (error) {
            this.error(`Sync failed: ${error.message}`);
            this.advertisement = null;
            await this.setUnavailable(error.message).catch(this.error);
            await this._setConnectedState(false);
        }
    }

    /**
     * Update the 'connected' capability and fire the hub_connected/hub_disconnected
     * flow triggers, but only on an actual state transition.
     * @param {boolean} connected
     * @returns {Promise<void>}
     * @private
     */
    async _setConnectedState(connected) {
        if (this.isConnected === connected) {
            return;
        }
        this.isConnected = connected;

        if (this.hasCapability('connected')) {
            await this.setCapabilityValue('connected', connected).catch(this.error);
        }

        const triggerId = connected ? 'hub_connected' : 'hub_disconnected';
        await this.homey.flow.getDeviceTriggerCard(triggerId).trigger(this).catch(this.error);
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

        if (!this.hasCapability('connected')) {
            this.addCapability('connected');
            this.homey.log(`created capability connected for ${this.getName()}`);
        }
    }

}

module.exports = PoweredUpHubDevice;
