// @ts-ignore

'use strict';

const { Device } = require('homey');
const {
  BTL_TRAIN_MOTOR_SERVICE_UUID,
  BTL_TRAIN_MOTOR_SYNC_INTERVAL,
} = require('../../lib/const');
const { mapPower } = require('../../lib/utils');

class TrainMotorDevice extends Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.setUnavailable()
      .catch(this.error);
    this.onSync = this.onSync.bind(this);
    this.onSyncInterval = setInterval(this.onSync, BTL_TRAIN_MOTOR_SYNC_INTERVAL);
    this.onSync();// do an initial sync

    this.currentPower = 0;

    this.registerCapabilityListener('power', async (value) => {
      if (value === 'break') {
        this.currentPower = 0;
        await this.setPower(mapPower(127));
      } else if (value === 'down') {
        this.currentPower -= 10;
        await this.setPower(mapPower(this.currentPower));
      } else if (value === 'up') {
        this.currentPower += 10;
        await this.setPower(mapPower(this.currentPower));
      }

      this.log(`set power to ${this.currentPower} for ${this.getName()}`);
    });

    this.registerCapabilityListener('connect', async (value) => {
      this.log(`connecting to ${this.getName()}`);
      await this.onSync();
    });

    await this._createMissingCapabilities();

    this.log('TrainMotorDevice has been initialized');
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('TrainMotorDevice has been added');
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
    this.log('TrainMotorDevice settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('TrainMotorDevice was renamed');
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
    this.log('TrainMotorDevice has been deleted');
  }

  /**
   *  Sync the device
   * @returns {Promise<void>}
   */
  async onSync() {
    this.log('Syncing...');

    const { uuid } = this.getData();

    try {
      if (!this.peripheral) {
        this.advertisement = await this.homey.ble.find(uuid);
        this.log(`Device ${this.advertisement.localName} found!`);
        if (!this.peripheral || !this.peripheral.isConnected) {
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
      }
      if (this.peripheral && this.peripheral.isConnected) {
        await this.peripheral.assertConnected();
        await this.peripheral.discoverAllServicesAndCharacteristics();
        await this.setAvailable();
      }
    } catch (error) {
      this.error(error);
      // await this.setUnavailable(error.message);
    }
  }

  /**
   * Set the power
   * @param power
   * @returns {Promise<void>}
   */
  async setPower(power) {
    const service = await this.peripheral.getService(BTL_TRAIN_MOTOR_SERVICE_UUID);
    const characteristics = await service.discoverCharacteristics();
    const defaultPort = await this.getDefaultPort();
    for (const characteristic of characteristics) {
      // message
      let message = Buffer.concat([
        Buffer.from([0x81]),
        defaultPort,
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

  /**
   *  Create missing capabilities
   * @returns {Promise<void>}
   * @private
   */
  async _createMissingCapabilities() {
    if (!this.hasCapability('power')) {
      this.addCapability('power');
      this.homey.log(`created capability power for ${this.getName()}`);
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

module.exports = TrainMotorDevice;
