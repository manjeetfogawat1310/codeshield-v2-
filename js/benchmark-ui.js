import { runBenchmark } from "./experiments/benchmark.js";

const byId = id => document.getElementById(id);
const probability = byId("error-probability");
const pValue = byId("p-value");
const frameCount = byId("frame-count");
const seedInput = byId("random-seed");
const runButton = byId("run-benchmark");
const status = byId("benchmark-status");
const tbody = byId("benchmark-results");
const canvas = byId("ber-chart");
const exportButton = byId("export-results");
let latestResult = null;

probability.addEventListener("input", () => {
  pValue.textContent = `${Number(probability.value).toFixed(1)}%`;
});

function formatRate(value) {
  if (value === 0) return "0";
  if (value < 0.0001) return value.toExponential(2);
  return value.toFixed(5).replace(/0+$/, "").replace(/\.$/, "");
}

function renderTable(results) {
  tbody.replaceChildren();
  for (const row of results) {
    const tr = document.createElement("tr");
    const values = [
      row.name,
      row.codeRate.toFixed(3),
      `${row.overheadPercent}%`,
      formatRate(row.preBER),
      formatRate(row.postBER),
      `${(row.frameErrorRate * 100).toFixed(2)}%`
    ];
    values.forEach((value, index) => {
      const td = document.createElement("td");
      if (index === 0) {
        const dot = document.createElement("i");
        dot.className = "scheme-dot";
        td.append(dot, document.createTextNode(value));
      } else {
        td.textContent = value;
      }
      tr.append(td);
    });
    tbody.append(tr);
  }
}

function drawChart(results) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(320, rect.width);
  const height = Math.max(160, rect.height);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const left = 54, right = 18, top = 18, bottom = 38;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const max = Math.max(0.01, ...results.map(r => r.postBER)) * 1.15;
  ctx.font = "10px 'DM Mono', monospace";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i++) {
    const y = top + plotH * i / 4;
    ctx.strokeStyle = "rgba(151,170,205,.13)";
    ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(width - right, y); ctx.stroke();
    ctx.fillStyle = "#71809a";
    ctx.textAlign = "right";
    ctx.fillText((max * (1 - i / 4)).toPrecision(2), left - 9, y + 3);
  }

  const colors = ["#61e7f7", "#9d8cff", "#62e6b2", "#ffbd69"];
  const groupW = plotW / results.length;
  results.forEach((row, i) => {
    const barW = Math.min(62, groupW * .48);
    const x = left + groupW * i + (groupW - barW) / 2;
    const barH = Math.max(row.postBER > 0 ? 2 : 0, plotH * row.postBER / max);
    const y = top + plotH - barH;
    ctx.fillStyle = colors[i];
    ctx.globalAlpha = .88;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, barW, barH, [5, 5, 1, 1]);
    else ctx.rect(x, y, barW, barH);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#d7e2f4";
    ctx.textAlign = "center";
    ctx.fillText(formatRate(row.postBER), x + barW / 2, Math.max(top + 10, y - 7));
    ctx.fillStyle = "#8492ac";
    const label = row.name === "Repetition (3,1)" ? "Repetition" : row.name;
    ctx.fillText(label, left + groupW * i + groupW / 2, height - 13);
  });
}

function exportCSV() {
  if (!latestResult) return;
  const columns = ["scheme", "code_rate", "overhead_percent", "pre_BER", "post_BER", "frame_error_rate", "transmitted_bits", "channel_bit_errors", "recovered_bit_errors", "failed_frames", "total_frames"];
  const rows = latestResult.results.map(r => [
    r.name, r.codeRate, r.overheadPercent, r.preBER, r.postBER, r.frameErrorRate,
    r.transmittedBits, r.channelBitErrors, r.recoveredBitErrors, r.failedFrames, r.totalFrames
  ]);
  const csv = [columns, ...rows].map(row => row.map(value => {
    const s = String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `codeshield-benchmark-p${Number(latestResult.p).toFixed(3)}-seed${latestResult.seed}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

runButton.addEventListener("click", () => {
  const p = Number(probability.value) / 100;
  const frames = Number(frameCount.value);
  const seed = Number(seedInput.value);
  if (!Number.isInteger(seed) || seed < 1 || seed > 2147483647) {
    status.className = "bench-status";
    status.textContent = "Enter a random seed between 1 and 2,147,483,647.";
    return;
  }
  runButton.disabled = true;
  status.className = "bench-status running";
  status.textContent = "Running seeded experiment…";
  // Let the status paint before the synchronous simulation begins.
  setTimeout(() => {
    try {
      latestResult = runBenchmark({ p, frameCount: frames, seed });
      renderTable(latestResult.results);
      drawChart(latestResult.results);
      exportButton.disabled = false;
      status.className = "bench-status done";
      status.textContent = `Completed ${frames.toLocaleString()} frames per scheme (${(frames * 4).toLocaleString()} information bits per scheme). Seed ${seed}; BSC p = ${p.toFixed(3)}.`;
    } catch (error) {
      status.className = "bench-status";
      status.textContent = `Experiment failed: ${error.message}`;
    } finally {
      runButton.disabled = false;
    }
  }, 20);
});

exportButton.addEventListener("click", exportCSV);
window.addEventListener("resize", () => {
  if (latestResult) drawChart(latestResult.results);
});
