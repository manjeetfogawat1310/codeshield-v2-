import test from "node:test";
import assert from "node:assert/strict";
import { encode, decode, calculateSyndrome } from "../codes/hamming74.js";

function flipBit(codeword, position) {
  const bits = codeword.split("");
  bits[position - 1] = bits[position - 1] === "0" ? "1" : "0";
  return bits.join("");
}

test("encodes and decodes all 16 four-bit inputs", () => {
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

test("corrects every single-bit error for every codeword", () => {
  for (let value = 0; value < 16; value++) {
    const data = value.toString(2).padStart(4, "0");
    const original = encode(data);
    for (let position = 1; position <= 7; position++) {
      const result = decode(flipBit(original, position));
      assert.equal(result.errorPosition, position);
      assert.equal(result.correctedCodeword, original);
      assert.equal(result.dataBits, data);
      assert.equal(result.wasCorrected, true);
    }
  }
});

test("valid codeword has zero syndrome", () => {
  assert.deepEqual(calculateSyndrome("0110011"), { s1: 0, s2: 0, s4: 0, position: 0 });
});

test("invalid lengths are rejected", () => {
  assert.throws(() => encode("101"));
  assert.throws(() => decode("101010"));
});

test("non-binary strings are rejected", () => {
  assert.throws(() => encode("10A1"));
  assert.throws(() => decode("0120101"));
});

test("invalid array values are rejected", () => {
  assert.throws(() => encode([1, 0, 1, 2]));
});
