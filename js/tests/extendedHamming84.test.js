import test from "node:test";
import assert from "node:assert/strict";
import { encode84, decode84 } from "../codes/extendedHamming84.js";

function flip(word, position) {
  const bits = word.split("");
  bits[position - 1] = bits[position - 1] === "0" ? "1" : "0";
  return bits.join("");
}

test("Extended Hamming (8,4) encodes and recovers all 16 messages", () => {
  for (let value = 0; value < 16; value++) {
    const data = value.toString(2).padStart(4, "0");
    const codeword = encode84(data);
    const result = decode84(codeword);
    assert.equal(codeword.length, 8);
    assert.equal(result.dataBits, data);
    assert.equal(result.status, "no-error");
  }
});

test("SECDED corrects every single-bit error at positions 1 through 8", () => {
  for (let value = 0; value < 16; value++) {
    const data = value.toString(2).padStart(4, "0");
    const original = encode84(data);
    for (let position = 1; position <= 8; position++) {
      const result = decode84(flip(original, position));
      assert.equal(result.correctedPosition, position);
      assert.equal(result.correctedCodeword, original);
      assert.equal(result.dataBits, data);
      assert.ok(["single-bit-corrected", "overall-parity-bit-corrected"].includes(result.status));
    }
  }
});

test("SECDED detects every two-bit error without attempting correction", () => {
  const original = encode84("1011");
  for (let first = 1; first <= 8; first++) {
    for (let second = first + 1; second <= 8; second++) {
      const corrupted = flip(flip(original, first), second);
      const result = decode84(corrupted);
      assert.equal(result.status, "double-bit-error-detected", `positions ${first}, ${second}`);
      assert.equal(result.correctedCodeword, null);
      assert.equal(result.dataBits, null);
    }
  }
});

test("Extended Hamming rejects invalid inputs", () => {
  assert.throws(() => encode84("111"));
  assert.throws(() => decode84("1010101"));
  assert.throws(() => decode84("1010101x"));
});
