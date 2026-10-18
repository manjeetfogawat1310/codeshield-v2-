/*
 * Hamming (7,4), even parity.
 * Positions: [p1, p2, d1, p4, d2, d3, d4].
 */
function normalizeBits(input, expectedLength, name = "Input") {
  let bits;
  if (typeof input === "string") {
    if (!/^[01]+$/.test(input)) throw new TypeError(`${name} must contain only 0 and 1.`);
    bits = input.split("").map(Number);
  } else if (Array.isArray(input)) {
    bits = [...input];
  } else {
    throw new TypeError(`${name} must be a bit string or an array.`);
  }
  if (bits.length !== expectedLength) throw new RangeError(`${name} must contain exactly ${expectedLength} bits.`);
  if (!bits.every(bit => bit === 0 || bit === 1)) throw new TypeError(`${name} must contain only 0 and 1.`);
  return bits;
}
const bitsToString = bits => bits.join("");

export function encode(data) {
  const [d1, d2, d3, d4] = normalizeBits(data, 4, "Data");
  const p1 = d1 ^ d2 ^ d4;
  const p2 = d1 ^ d3 ^ d4;
  const p4 = d2 ^ d3 ^ d4;
  return bitsToString([p1, p2, d1, p4, d2, d3, d4]);
}

export function calculateSyndrome(received) {
  const bits = normalizeBits(received, 7, "Codeword");
  const s1 = bits[0] ^ bits[2] ^ bits[4] ^ bits[6];
  const s2 = bits[1] ^ bits[2] ^ bits[5] ^ bits[6];
  const s4 = bits[3] ^ bits[4] ^ bits[5] ^ bits[6];
  return { s1, s2, s4, position: s1 + 2 * s2 + 4 * s4 };
}

/* Decode under the assumption of at most one bit error. Multiple errors may be miscorrected. */
export function decode(received) {
  const bits = normalizeBits(received, 7, "Received word");
  const syndrome = calculateSyndrome(bits);
  const corrected = [...bits];
  const errorPosition = syndrome.position;
  if (errorPosition !== 0) corrected[errorPosition - 1] ^= 1;
  const dataBits = [corrected[2], corrected[4], corrected[5], corrected[6]];
  return {
    received: bitsToString(bits),
    syndrome,
    errorPosition,
    wasCorrected: errorPosition !== 0,
    correctedCodeword: bitsToString(corrected),
    dataBits: bitsToString(dataBits)
  };
}
