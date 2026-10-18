import test from "node:test";
import assert from "node:assert/strict";
import { injectBurst } from "../channels/burst.js";

test("burst flips the requested contiguous positions", () => {
  const result = injectBurst([0, 1, 1, 0, 0, 1, 0, 1], 3, 3);
  assert.deepEqual(result.received, [0, 1, 0, 1, 1, 1, 0, 1]);
  assert.deepEqual(result.flippedPositions, [3, 4, 5]);
});

test("burst input bounds are validated", () => {
  assert.throws(() => injectBurst([0, 1], 0, 1));
  assert.throws(() => injectBurst([0, 1], 1, 3));
  assert.throws(() => injectBurst([0, 1], 1, 0));
});
