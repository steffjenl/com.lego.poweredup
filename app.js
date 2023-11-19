'use strict';

const Homey = require('homey');

class PoweredUp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('Lego Powered UP has been initialized');
  }

}

module.exports = PoweredUp;
