import { selectCode } from "./experiments/selector.js";
const byId = id => document.getElementById(id);
const p = byId("selector-p"), frames = byId("selector-frames"), seed = byId("selector-seed");
const fer = byId("selector-fer"), overhead = byId("selector-overhead");
const ferLabel = byId("selector-fer-label"), overheadLabel = byId("selector-overhead-label");
const button = byId("run-selector"), status = byId("selector-status"), detail = byId("selector-detail"), list = byId("selector-candidates");
fer.addEventListener("input", () => ferLabel.textContent = `${Number(fer.value).toFixed(1)}%`);
overhead.addEventListener("input", () => overheadLabel.textContent = `${overhead.value}%`);
button.addEventListener("click", () => {
  const seedValue = Number(seed.value);
  if (!Number.isInteger(seedValue) || seedValue < 1 || seedValue > 2147483647) {
    status.textContent = "Enter a seed between 1 and 2,147,483,647."; return;
  }
  button.disabled = true;
  status.className = "bench-status running";
  status.textContent = "Evaluating candidates on the seeded BSC…";
  setTimeout(() => {
    try {
      const result = selectCode({ p: Number(p.value) / 100, frameCount: Number(frames.value), seed: seedValue,
        maxFER: Number(fer.value) / 100, maxOverhead: Number(overhead.value) });
      list.replaceChildren();
      for (const candidate of result.candidates) {
        const row = document.createElement("div"); row.className = "selector-candidate";
        const name = document.createElement("strong"); name.textContent = candidate.name;
        const metrics = document.createElement("span"); metrics.textContent = `FER ${(candidate.frameErrorRate * 100).toFixed(2)}% · overhead ${candidate.overheadPercent}% · post-BER ${candidate.postBER.toExponential(2)}`;
        const badge = document.createElement("em"); badge.textContent = candidate.eligible ? "ELIGIBLE" : (!candidate.withinOverhead ? "OVER BUDGET" : "FER TARGET MISSED");
        badge.className = candidate.eligible ? "eligible" : "ineligible";
        row.append(name, metrics, badge); list.append(row);
      }
      if (result.recommendation) {
        status.className = "bench-status done";
        status.textContent = `Recommended: ${result.recommendation.name}. It has the lowest overhead among schemes meeting the measured FER target.`;
        detail.textContent = `Observed FER ${(result.recommendation.frameErrorRate * 100).toFixed(2)}%, post-BER ${result.recommendation.postBER.toExponential(3)}, code rate ${result.recommendation.codeRate.toFixed(3)}. Trial: ${Number(frames.value).toLocaleString()} frames, BSC p=${(Number(p.value)/100).toFixed(3)}, seed ${seedValue}.`;
      } else {
        status.className = "bench-status";
        status.textContent = "No tested scheme met both constraints in this experiment. Relax the FER target or overhead cap, or increase the frame count.";
        detail.textContent = "No recommendation was made: the selector will not silently relax your constraints.";
      }
    } catch (error) { status.className = "bench-status"; status.textContent = `Selector failed: ${error.message}`; }
    finally { button.disabled = false; }
  }, 20);
});
