import { runBenchmark } from "./benchmark.js";

/**
 * Empirical, constraint-aware selector. Chooses the lowest-overhead code that
 * meets the measured FER target and overhead cap in a seeded BSC experiment.
 * This is a simulation-based recommendation, not a formal reliability guarantee.
 */
export function selectCode({ p = 0.02, frameCount = 5000, seed = 2468,
  maxFER = 0.01, maxOverhead = 100 } = {}) {
  if (typeof maxFER !== "number" || !Number.isFinite(maxFER) || maxFER < 0 || maxFER > 1) {
    throw new RangeError("maxFER must be between 0 and 1.");
  }
  if (typeof maxOverhead !== "number" || !Number.isFinite(maxOverhead) || maxOverhead < 0) {
    throw new RangeError("maxOverhead must be a non-negative number.");
  }
  const experiment = runBenchmark({ p, frameCount, seed });
  const eligible = experiment.results
    .filter(row => row.overheadPercent <= maxOverhead && row.frameErrorRate <= maxFER)
    .sort((a, b) => a.overheadPercent - b.overheadPercent || a.postBER - b.postBER || a.frameErrorRate - b.frameErrorRate);
  return {
    p, frameCount, seed, maxFER, maxOverhead,
    recommendation: eligible[0] ?? null,
    candidates: experiment.results.map(row => ({
      ...row,
      withinOverhead: row.overheadPercent <= maxOverhead,
      meetsReliability: row.frameErrorRate <= maxFER,
      eligible: row.overheadPercent <= maxOverhead && row.frameErrorRate <= maxFER
    }))
  };
}
