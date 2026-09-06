'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mapPower } = require('../lib/utils');

test('mapPower passes through in-range values', () => {
  assert.equal(mapPower(0), 0);
  assert.equal(mapPower(50), 50);
  assert.equal(mapPower(-50), -50);
  assert.equal(mapPower(100), 100);
  assert.equal(mapPower(-100), -100);
});

test('mapPower clamps out-of-range values to [-100, 100]', () => {
  assert.equal(mapPower(150), 100);
  assert.equal(mapPower(-150), -100);
});

test('mapPower passes the brake sentinel (127) through unclamped', () => {
  assert.equal(mapPower(127), 127);
});
