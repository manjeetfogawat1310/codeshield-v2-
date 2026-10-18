import test from "node:test";
import assert from "node:assert/strict";

import {
  encode,
  decode,
  calculateSyndrome
} from "./hamming74.js";

function flipBit(codeword, position) {
  const bits = codeword.split("");
  const index = position - 1;
  bits[index] = bits[index] === "0" ? "1" : "0";
  return bits.join("");
}

test("Hamming (7,4) encodes and decodes all 16 inputs", () => {
  for (let value = 0; value < 16; value++) {
    const data = value.toString(2).padStart(4, "0");
    const codeword = encode(data);
    const result = decode(codeword);

    assert.equal(codeword.length, 7);
    assert.equal(result.dataBits, data);
    assert.equal(result.errorPosition, 0);
    assert.equal(result.correctedCodeword, codeword);
  }
});

test("Every single-bit error is identified and corrected", () => {
  for (let value = 0; value < 16; value++) {
    const data = value.toString(2).padStart(4, "0");
    const original = encode(data);

    for (let position = 1; position <= 7; position++) {
      const corrupted = flipBit(original, position);
      const result = decode(corrupted);

      assert.equal(
        result.errorPosition,
        position,
        `Wrong syndrome for ${data}, bit ${position}`
      );
      assert.equal(result.correctedCodeword, original);
      assert.equal(result.dataBits, data);
      assert.equal(result.wasCorrected, true);
    }
  }
});

test("A valid codeword has a zero syndrome", () => {
  const result = calculateSyndrome("0110011");

  assert.deepEqual(result, {
    s1: 0,
    s2: 0,
    s4: 0,
    position: 0
  });
});

test("Invalid data lengths are rejected", () => {
  assert.throws(() => encode("101"));
  assert.throws(() => decode("101010"));
});

test("Non-binary input is rejected", () => {
  assert.throws(() => encode("10A1"));
  assert.throws(() => decode("0120101"));
});

test("Invalid array values are rejected", () => {
  assert.throws(() => encode([1, 0, 1, 2]));
});
