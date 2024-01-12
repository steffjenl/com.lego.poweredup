'use strict';

const { Driver } = require('homey');
const {
  BTL_POWERED_UP_HUB_SERVICE_UUID,
  BTL_POWERED_UP_HUB_BTL_DISCOVER_INTERVAL,
} = require('../../lib/const');

class PoweredUpHubDriver extends Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.advertisements = {};
    this.onDiscover = this.onDiscover.bind(this);
    this.onDiscoverInterval = setInterval(this.onDiscover, BTL_POWERED_UP_HUB_BTL_DISCOVER_INTERVAL);
    await this.onDiscover();
    this.log('PoweredUpHubDriver has been initialized');
  }

  async onDiscover() {
    this.log('Discovering...');
    this.log('looking for service uuid:', BTL_POWERED_UP_HUB_SERVICE_UUID);

    const advertisements = await this.homey.ble.discover([BTL_POWERED_UP_HUB_SERVICE_UUID])
      .catch(this.error);
    this.log(`Found ${advertisements.length} devices.`);
    advertisements.forEach((advertisement) => {
      if (!this.advertisements[advertisement.address]) {
        this.advertisements[advertisement.address] = advertisement;
        this.emit(`advertisement:${advertisement.address}`, advertisement);
      }
    });
  }

  async getAdvertisement({ address }) {
    if (this.advertisements[address]) {
      return this.advertisements[address];
    }

    return new Promise((resolve) => {
      this.once(`advertisement:${address}`, resolve);
    });
  }

  /**
   * onPairListDevices is called when a user is adding a device
   * and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    this.log('Pairing...');
    return Object.entries(this.advertisements)
      .map(([address, advertisement]) => ({
        data: {
          address,
          uuid: advertisement.uuid,
        },
        name: advertisement.localName,
      }));
  }

}

module.exports = PoweredUpHubDriver;
