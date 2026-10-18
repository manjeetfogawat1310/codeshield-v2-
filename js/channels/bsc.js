/**
 * Binary Symmetric Channel (BSC): each transmitted bit is flipped
 * independently with probability p.
 */
export function createSeededRandom(seed = 123456789) {
  let state = Number(seed) >>> 0;
  if (state === 0) state = 0x6d2b79f5;
  return function random() {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14) >>> 0) >>> 0) / 4294967296;
  };
}

export function transmitBSC(bits, p, random = Math.random) {
  if (!Array.isArray(bits) || !bits.every(bit => bit === 0 || bit === 1)) {
    throw new TypeError("bits must be an array containing only 0 and 1.");
  }
  if (typeof p !== "number" || !Number.isFinite(p) || p < 0 || p > 1) {
    throw new RangeError("p must be a number between 0 and 1.");
  }
  const received = [];
  let errors = 0;
  for (const bit of bits) {
    const flip = random() < p;
    received.push(flip ? bit ^ 1 : bit);
    if (flip) errors++;
  }
  return { received, errors, totalBits: bits.length };
}
