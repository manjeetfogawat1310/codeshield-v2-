import "./benchmark-ui.js";
import { encode, decode } from "./codes/hamming74.js";

const $ = selector => document.querySelector(selector);
const dataInput = $("#data-input");
const inputHelp = $("#input-help");
const encodedBits = $("#encoded-bits");
const receivedBits = $("#received-bits");
const errorCount = $("#error-count");
const channelMessage = $("#channel-message");
const toast = $("#toast");

let originalData = "1011";
let codeword = encode(originalData);
let received = codeword.split("").map(Number);
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function renderBitRow(container, bits, interactive = false) {
  container.replaceChildren();
  bits.forEach((bit, index) => {
    const position = index + 1;
    const isParity = [1, 2, 4].includes(position);
    const button = document.createElement(interactive ? "button" : "div");
    button.className = `bit-cell ${isParity ? "parity" : "data"}`;
    if (interactive && bit !== Number(codeword[index])) button.classList.add("error");
    if (interactive) {
      button.type = "button";
      button.setAttribute("aria-label", `Bit position ${position}, value ${bit}. Click to flip.`);
      button.title = `Position ${position}: click to flip`;
      button.addEventListener("click", () => {
        received[index] ^= 1;
        clearDiagnostics();
        renderAll();
        showToast(`Bit ${position} flipped to ${received[index]}.`);
      });
    }
    const pos = document.createElement("span");
    pos.className = "bit-pos";
    pos.textContent = isParity ? `P${position}` : `#${position}`;
    const value = document.createElement("span");
    value.className = "bit-value";
    value.textContent = String(bit);
    button.append(pos, value);
    container.append(button);
  });
}

function renderAll() {
  renderBitRow(encodedBits, codeword.split("").map(Number));
  renderBitRow(receivedBits, received, true);
  const changed = received.reduce((n, bit, i) => n + (bit !== Number(codeword[i]) ? 1 : 0), 0);
  errorCount.textContent = `${changed} bit flip${changed === 1 ? "" : "s"}`;
  errorCount.classList.toggle("clear", changed === 0);
  channelMessage.textContent = changed === 0
    ? "Channel is clear. No bits have been changed."
    : `${changed} bit${changed === 1 ? " has" : "s have"} been changed from the encoded word.`;
}

function clearDiagnostics() {
  ["#s1-value", "#s2-value", "#s4-value"].forEach(id => {
    $(id).textContent = "—";
    $(id).classList.remove("one");
  });
  $("#syndrome-value").textContent = "—";
  $("#syndrome-binary").textContent = "Awaiting decode";
  $("#recovered-data").textContent = "----";
  $("#recovered-caption").textContent = "No result yet";
  $("#corrected-codeword").textContent = "-------";
  $("#recovery-status").className = "recovery-status";
  $("#recovery-status").innerHTML = '<span class="status-symbol">…</span><span><b>Ready to decode</b><small>Run syndrome analysis to inspect the received word.</small></span>';
}

function handleEncode() {
  const value = dataInput.value.trim();
  if (!/^[01]{4}$/.test(value)) {
    inputHelp.textContent = "Please enter exactly four binary digits (0 or 1).";
    inputHelp.classList.add("invalid");
    dataInput.setAttribute("aria-invalid", "true");
    dataInput.focus();
    showToast("Invalid input: enter exactly four bits.");
    return;
  }
  originalData = value;
  codeword = encode(originalData);
  received = codeword.split("").map(Number);
  inputHelp.textContent = "Valid 4-bit message. Codeword generated using even parity.";
  inputHelp.classList.remove("invalid");
  dataInput.removeAttribute("aria-invalid");
  clearDiagnostics();
  renderAll();
  showToast(`Encoded ${originalData} as ${codeword}.`);
}

function handleDecode() {
  const result = decode(received.join(""));
  ["s1", "s2", "s4"].forEach(key => {
    const el = $(`#${key}-value`);
    el.textContent = result.syndrome[key];
    el.classList.toggle("one", result.syndrome[key] === 1);
  });
  $("#syndrome-value").textContent = String(result.errorPosition);
  $("#syndrome-binary").textContent = `S₄S₂S₁ = ${result.syndrome.s4}${result.syndrome.s2}${result.syndrome.s1}₂`;
  $("#recovered-data").textContent = result.dataBits;
  $("#corrected-codeword").textContent = result.correctedCodeword;
  $("#recovered-caption").textContent = result.dataBits === originalData ? "Matches the original message" : "Differs from the original message";

  const changed = received.reduce((n, bit, i) => n + (bit !== Number(codeword[i]) ? 1 : 0), 0);
  const status = $("#recovery-status");
  if (result.errorPosition === 0) {
    status.className = "recovery-status success";
    status.innerHTML = '<span class="status-symbol">✓</span><span><b>No error indicated</b><small>The received word has a zero syndrome.</small></span>';
  } else {
    const success = result.dataBits === originalData;
    status.className = `recovery-status ${success ? "success" : "warning"}`;
    const heading = success ? `Bit ${result.errorPosition} corrected` : `Syndrome points to bit ${result.errorPosition}`;
    const detail = changed > 1
      ? "Multiple bits differ from the transmitted word. A basic Hamming decoder may miscorrect multiple errors."
      : "The syndrome identifies the single-bit error position.";
    status.innerHTML = `<span class="status-symbol">${success ? "✓" : "!"}</span><span><b>${heading}</b><small>${detail}</small></span>`;
  }
  showToast(result.errorPosition === 0 ? "Syndrome is zero." : `Syndrome points to bit ${result.errorPosition}.`);
}

$("#encode-btn").addEventListener("click", handleEncode);
$("#decode-btn").addEventListener("click", handleDecode);
$("#reset-btn").addEventListener("click", () => {
  received = codeword.split("").map(Number);
  clearDiagnostics();
  renderAll();
  showToast("Channel reset to the encoded codeword.");
});
$("#random-error-btn").addEventListener("click", () => {
  const index = Math.floor(Math.random() * 7);
  received[index] ^= 1;
  clearDiagnostics();
  renderAll();
  showToast(`Random error injected at bit ${index + 1}.`);
});
dataInput.addEventListener("keydown", event => { if (event.key === "Enter") handleEncode(); });
dataInput.addEventListener("input", () => {
  inputHelp.classList.remove("invalid");
  dataInput.removeAttribute("aria-invalid");
});
renderAll();
clearDiagnostics();
