import test from "node:test";
import assert from "node:assert/strict";
import { selectCode } from "../experiments/selector.js";

test("benchmark compares four schemes including SECDED", async () => {
  const { runBenchmark } = await import("../experiments/benchmark.js");
  const result = runBenchmark({ p: 0.02, frameCount: 100, seed: 42 });
  assert.deepEqual(result.results.map(row => row.name), ["Uncoded", "Repetition (3,1)", "Hamming (7,4)", "SECDED (8,4)"]);
  assert.equal(result.results[3].codeRate, 0.5);
  assert.equal(result.results[3].overheadPercent, 100);
  for (const row of result.results) {
    assert.ok(row.postBER >= 0 && row.postBER <= 1);
    assert.ok(row.frameErrorRate >= 0 && row.frameErrorRate <= 1);
  }
});

test("selector is deterministic for a fixed seed and constraints", () => {
  const options = { p: 0.02, frameCount: 500, seed: 17, maxFER: 1, maxOverhead: 100 };
  assert.deepEqual(selectCode(options), selectCode(options));
});

test("selector never recommends a code over the overhead cap", () => {
  const result = selectCode({ p: 0.02, frameCount: 200, seed: 5, maxFER: 1, maxOverhead: 0 });
  if (result.recommendation) assert.ok(result.recommendation.overheadPercent <= 0);
  else assert.equal(result.candidates.some(row => row.eligible), false);
});

test("selector reports no feasible code rather than relaxing constraints", () => {
  const result = selectCode({ p: 0.2, frameCount: 10, seed: 7, maxFER: 0, maxOverhead: 0 });
  assert.equal(result.recommendation, null);
});

test("selector rejects invalid constraints", () => {
  assert.throws(() => selectCode({ maxFER: 2 }), /maxFER/);
  assert.throws(() => selectCode({ maxOverhead: -1 }), /maxOverhead/);
});
