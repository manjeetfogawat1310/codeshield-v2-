/*
 * Extended Hamming (8,4), even parity, SECDED.
 * Positions 1..7 use Hamming (7,4): [p1,p2,d1,p4,d2,d3,d4].
 * Position 8 is an overall even-parity bit.
 *
 * SECDED classification:
 * syndrome=0, overall=0: no error indicated
 * syndrome!=0, overall=1: single error in positions 1..7; correct it
 * syndrome=0, overall=1: error in position 8; correct it
 * syndrome!=0, overall=0: detected double-bit error; do not correct
 *
 * Three or more errors are not guaranteed to be detected correctly.
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

export function encode84(data) {
  const [d1, d2, d3, d4] = normalizeBits(data, 4, "Data");
  const p1 = d1 ^ d2 ^ d4;
  const p2 = d1 ^ d3 ^ d4;
  const p4 = d2 ^ d3 ^ d4;
  const firstSeven = [p1, p2, d1, p4, d2, d3, d4];
  const overall = firstSeven.reduce((parity, bit) => parity ^ bit, 0);
  return bitsToString([...firstSeven, overall]);
}

export function decode84(received) {
  const bits = normalizeBits(received, 8, "Received word");
  const firstSeven = bits.slice(0, 7);
  const s1 = firstSeven[0] ^ firstSeven[2] ^ firstSeven[4] ^ firstSeven[6];
  const s2 = firstSeven[1] ^ firstSeven[2] ^ firstSeven[5] ^ firstSeven[6];
  const s4 = firstSeven[3] ^ firstSeven[4] ^ firstSeven[5] ^ firstSeven[6];
  const syndromePosition = s1 + 2 * s2 + 4 * s4;
  const overallParity = bits.reduce((parity, bit) => parity ^ bit, 0);
  const corrected = [...bits];

  let status;
  let correctedPosition = null;

  if (syndromePosition === 0 && overallParity === 0) {
    status = "no-error";
  } else if (syndromePosition !== 0 && overallParity === 1) {
    corrected[syndromePosition - 1] ^= 1;
    correctedPosition = syndromePosition;
    status = "single-bit-corrected";
  } else if (syndromePosition === 0 && overallParity === 1) {
    corrected[7] ^= 1;
    correctedPosition = 8;
    status = "overall-parity-bit-corrected";
  } else {
    status = "double-bit-error-detected";
  }

  const dataBits = status === "double-bit-error-detected"
    ? null
    : bitsToString([corrected[2], corrected[4], corrected[5], corrected[6]]);

  return {
    received: bitsToString(bits),
    syndrome: { s1, s2, s4, position: syndromePosition },
    overallParity,
    status,
    correctedPosition,
    correctedCodeword: status === "double-bit-error-detected" ? null : bitsToString(corrected),
    dataBits
  };
}
