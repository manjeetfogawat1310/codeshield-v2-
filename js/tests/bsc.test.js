import test from "node:test";
import assert from "node:assert/strict";
import { createSeededRandom, transmitBSC } from "../channels/bsc.js";
import { runBenchmark } from "../experiments/benchmark.js";

test("BSC with p=0 never flips a bit", () => {
  const result = transmitBSC([0, 1, 0, 1], 0, () => 0.5);
  assert.deepEqual(result.received, [0, 1, 0, 1]);
  assert.equal(result.errors, 0);
});

test("BSC with p=1 flips every bit", () => {
  const result = transmitBSC([0, 1, 0, 1], 1, () => 0.5);
  assert.deepEqual(result.received, [1, 0, 1, 0]);
  assert.equal(result.errors, 4);
});

test("seeded random stream is reproducible", () => {
  const a = createSeededRandom(99);
  const b = createSeededRandom(99);
  assert.deepEqual(Array.from({ length: 10 }, a), Array.from({ length: 10 }, b));
});

test("benchmark returns valid metrics for all schemes", () => {
  const result = runBenchmark({ p: 0.02, frameCount: 100, seed: 42 });
  assert.equal(result.results.length, 4);
  for (const row of result.results) {
    assert.ok(row.preBER >= 0 && row.preBER <= 1);
    assert.ok(row.postBER >= 0 && row.postBER <= 1);
    assert.ok(row.frameErrorRate >= 0 && row.frameErrorRate <= 1);
    assert.ok(row.transmittedBits > 0);
  }
});

test("benchmark is reproducible with the same seed", () => {
  assert.deepEqual(
    runBenchmark({ p: 0.04, frameCount: 20, seed: 77 }),
    runBenchmark({ p: 0.04, frameCount: 20, seed: 77 })
  );
});

test("benchmark rejects invalid parameters", () => {
  assert.throws(() => runBenchmark({ p: 1.5, frameCount: 10 }));
  assert.throws(() => runBenchmark({ p: 0.1, frameCount: 0 }));
});
