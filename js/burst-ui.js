import { encode84, decode84 } from "./codes/extendedHamming84.js";
import { injectBurst } from "./channels/burst.js";

const $ = id => document.getElementById(id);
const dataInput = $("burst-data");
const startSelect = $("burst-start");
const lengthSelect = $("burst-length");
const bitsContainer = $("extended-bits");
const resultBox = $("burst-result");

for (let position = 1; position <= 8; position++) {
  const option = document.createElement("option");
  option.value = String(position);
  option.textContent = `Position ${position}`;
  startSelect.append(option);
}
startSelect.value = "3";

function renderWord(bits, flipped = []) {
  bitsContainer.replaceChildren();
  bits.forEach((bit, index) => {
    const position = index + 1;
    const isParity = [1, 2, 4, 8].includes(position);
    const cell = document.createElement("div");
    cell.className = `bit-cell ${isParity ? "parity" : "data"}${flipped.includes(position) ? " error" : ""}`;
    const pos = document.createElement("span");
    pos.className = "bit-pos";
    pos.textContent = position === 8 ? "P₀" : isParity ? `P${position}` : `#${position}`;
    const value = document.createElement("span");
    value.className = "bit-value";
    value.textContent = String(bit);
    cell.append(pos, value);
    bitsContainer.append(cell);
  });
}

function run() {
  const data = dataInput.value.trim();
  if (!/^[01]{4}$/.test(data)) {
    resultBox.className = "burst-result warning";
    resultBox.textContent = "Enter exactly four binary digits (0 or 1).";
    return;
  }
  const original = encode84(data);
  const start = Number(startSelect.value);
  const length = Number(lengthSelect.value);
  if (start + length - 1 > 8) {
    resultBox.className = "burst-result warning";
    resultBox.textContent = "That burst would extend past position 8. Choose an earlier start or shorter burst.";
    renderWord(original.split("").map(Number));
    return;
  }

  const injected = injectBurst(original.split("").map(Number), start, length);
  const received = injected.received.join("");
  const decoded = decode84(received);
  renderWord(injected.received, injected.flippedPositions);

  let heading, explanation, className = "burst-result";
  if (decoded.status === "no-error") {
    heading = "No error indicated";
    explanation = "The received word has zero syndrome and even overall parity.";
    className += " success";
  } else if (decoded.status === "single-bit-corrected" || decoded.status === "overall-parity-bit-corrected") {
    heading = `Single-bit correction at position ${decoded.correctedPosition}`;
    explanation = `SECDED returned ${decoded.dataBits}. With a burst of length greater than one, this is not guaranteed to be the original data.`;
    className += " warning";
  } else {
    heading = "Double-bit error detected";
    explanation = "The decoder refuses to guess a correction. The data is marked unavailable because the word is not safely correctable by SECDED.";
    className += " detected";
  }
  resultBox.className = className;
  resultBox.replaceChildren();
  const title = document.createElement("strong");
  title.textContent = heading;
  const details = document.createElement("p");
  details.textContent = `Transmitted: ${original} · Received: ${received}`;
  const detail2 = document.createElement("p");
  detail2.textContent = `Syndrome: ${decoded.syndrome.s4}${decoded.syndrome.s2}${decoded.syndrome.s1}₂ (${decoded.syndrome.position}) · Overall parity: ${decoded.overallParity}`;
  const detail3 = document.createElement("p");
  detail3.textContent = explanation;
  resultBox.append(title, details, detail2, detail3);
}

$("run-burst").addEventListener("click", run);
lengthSelect.addEventListener("change", () => {
  const maxStart = 9 - Number(lengthSelect.value);
  if (Number(startSelect.value) > maxStart) startSelect.value = String(maxStart);
  run();
});
startSelect.addEventListener("change", run);
dataInput.addEventListener("input", run);
run();
