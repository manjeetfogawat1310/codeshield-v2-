/**
 * Flip a contiguous run of bits in a transmitted word.
 * startPosition is 1-based; burstLength must fit within the word.
 */
export function injectBurst(bits, startPosition, burstLength) {
  if (!Array.isArray(bits) || !bits.every(bit => bit === 0 || bit === 1)) {
    throw new TypeError("bits must be an array containing only 0 and 1.");
  }
  if (!Number.isInteger(startPosition) || startPosition < 1 || startPosition > bits.length) {
    throw new RangeError("startPosition must be a valid 1-based bit position.");
  }
  if (!Number.isInteger(burstLength) || burstLength < 1 || startPosition + burstLength - 1 > bits.length) {
    throw new RangeError("burstLength must be positive and fit within the word.");
  }
  const received = [...bits];
  for (let position = startPosition; position < startPosition + burstLength; position++) {
    received[position - 1] ^= 1;
  }
  return {
    transmitted: [...bits],
    received,
    startPosition,
    burstLength,
    flippedPositions: Array.from({ length: burstLength }, (_, i) => startPosition + i)
  };
}
