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
    this._registerFlowCards();
    this.log('PoweredUpHubDriver has been initialized');
  }

  /**
   * Register Flow action/condition run listeners. Device trigger cards
   * (hub_connected/hub_disconnected) don't need a run listener - devices
   * trigger them directly.
   * @private
   */
  _registerFlowCards() {
    this.homey.flow.getActionCard('set_power')
      .registerRunListener(async (args) => {
        await args.device.setPortPower(args.port, args.power);
      });

    this.homey.flow.getActionCard('run_for_duration')
      .registerRunListener(async (args) => {
        await args.device.setPortPower(args.port, args.power);
        await new Promise((resolve) => setTimeout(resolve, args.duration * 1000));
        await args.device.brakePort(args.port);
      });

    this.homey.flow.getActionCard('brake')
      .registerRunListener(async (args) => {
        await args.device.brakePort(args.port);
      });

    this.homey.flow.getConditionCard('hub_is_connected')
      .registerRunListener(async (args) => Boolean(args.device.isConnected));
  }

  async onDiscover() {
    this.log('Discovering...');
    this.log('looking for service uuid:', BTL_POWERED_UP_HUB_SERVICE_UUID);

    const advertisements = await this.homey.ble.discover([BTL_POWERED_UP_HUB_SERVICE_UUID])
      .catch((error) => {
        this.error(error);
        return [];
      });
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
