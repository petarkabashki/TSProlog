'use strict';
import process from 'node:process';
import BigInt from 'big-integer';

const loadNs = process.hrtime();
const loadMs = new Date().getTime();

export function nanoseconds() {
  let diffNs = process.hrtime(loadNs);
  return BigInt(loadMs).times(1e6).add(BigInt(diffNs[0]).times(1e9).plus(diffNs[1]));
}

export function microseconds() {
  return BigInt(nanoseconds()).divide(1e3);
}

// module.exports = nanoseconds;
// module.exports.microseconds = module.exports.micro = microseconds;