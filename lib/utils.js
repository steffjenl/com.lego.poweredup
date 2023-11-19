'use strict';

module.exports = {
  mapPower(power) {
    if (power === 127) {
      return 127;
    }
    if (power > 100) {
      return 100;
    }
    if (power < -100) {
      return -100;
    }
    return power;
  },
};
