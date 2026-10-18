import { encode, decode } from "../codes/hamming74.js";
import { encode84, decode84 } from "../codes/extendedHamming84.js";
import { createSeededRandom, transmitBSC } from "../channels/bsc.js";

function randomBits(length, random) {
  return Array.from({ length }, () => random() < 0.5 ? 1 : 0);
}

function countBitErrors(a, b) {
  let errors = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) errors++;
  return errors;
}

function asBits(value) {
  return value.split("").map(Number);
}

function bitsToString(bits) {
  return bits.join("");
}

function evaluateUncoded(infoBits, p, random) {
  const channel = transmitBSC(infoBits, p, random);
  return {
    name: "Uncoded",
    rate: 1,
    overhead: 0,
    preErrors: channel.errors,
    transmittedBits: channel.totalBits,
    postErrors: countBitErrors(infoBits, channel.received),
    infoBits: infoBits.length,
    frameErrors: countFrameErrors(infoBits, channel.received, 4)
  };
}

function countFrameErrors(original, decoded, frameSize) {
  let frameErrors = 0;
  for (let start = 0; start < original.length; start += frameSize) {
    if (countBitErrors(original.slice(start, start + frameSize), decoded.slice(start, start + frameSize)) > 0) {
      frameErrors++;
    }
  }
  return frameErrors;
}

function evaluateRepetition(infoBits, p, random) {
  const transmitted = [];
  for (const bit of infoBits) transmitted.push(bit, bit, bit);
  const channel = transmitBSC(transmitted, p, random);
  const decoded = [];
  for (let i = 0; i < channel.received.length; i += 3) {
    const group = channel.received.slice(i, i + 3);
    decoded.push(group.reduce((sum, bit) => sum + bit, 0) >= 2 ? 1 : 0);
  }
  return {
    name: "Repetition (3,1)",
    rate: 1 / 3,
    overhead: 200,
    preErrors: channel.errors,
    transmittedBits: channel.totalBits,
    postErrors: countBitErrors(infoBits, decoded),
    infoBits: infoBits.length,
    frameErrors: countFrameErrors(infoBits, decoded, 4)
  };
}

function evaluateHamming(infoBits, p, random) {
  const transmitted = [];
  for (let i = 0; i < infoBits.length; i += 4) {
    transmitted.push(...asBits(encode(bitsToString(infoBits.slice(i, i + 4)))));
  }
  const channel = transmitBSC(transmitted, p, random);
  const decoded = [];
  for (let i = 0; i < channel.received.length; i += 7) {
    const receivedWord = bitsToString(channel.received.slice(i, i + 7));
    decoded.push(...asBits(decode(receivedWord).dataBits));
  }
  return {
    name: "Hamming (7,4)",
    rate: 4 / 7,
    overhead: 75,
    preErrors: channel.errors,
    transmittedBits: channel.totalBits,
    postErrors: countBitErrors(infoBits, decoded),
    infoBits: infoBits.length,
    frameErrors: countFrameErrors(infoBits, decoded, 4)
  };
}


function evaluateSECDED(infoBits, p, random) {
  const transmitted = [];
  for (let i = 0; i < infoBits.length; i += 4) {
    transmitted.push(...asBits(encode84(bitsToString(infoBits.slice(i, i + 4)))));
  }
  const channel = transmitBSC(transmitted, p, random);
  const decoded = [];
  for (let i = 0; i < channel.received.length; i += 8) {
    const word = bitsToString(channel.received.slice(i, i + 8));
    const result = decode84(word);
    // A detected double error is treated as an erasure by the decoder. For
    // comparable BER accounting, retain the received systematic data bits.
    decoded.push(...asBits(result.dataBits ?? [word[2], word[4], word[5], word[6]].join("")));
  }
  return {
    name: "SECDED (8,4)", rate: 1 / 2, overhead: 100,
    preErrors: channel.errors, transmittedBits: channel.totalBits,
    postErrors: countBitErrors(infoBits, decoded), infoBits: infoBits.length,
    frameErrors: countFrameErrors(infoBits, decoded, 4)
  };
}

function summarize(result) {
  return {
    name: result.name,
    codeRate: result.rate,
    overheadPercent: result.overhead,
    preBER: result.preErrors / result.transmittedBits,
    postBER: result.postErrors / result.infoBits,
    frameErrorRate: result.frameErrors / (result.infoBits / 4),
    transmittedBits: result.transmittedBits,
    channelBitErrors: result.preErrors,
    recoveredBitErrors: result.postErrors,
    failedFrames: result.frameErrors,
    totalFrames: result.infoBits / 4
  };
}

/**
 * Runs a reproducible BSC comparison. frameCount is a multiple of four
 * information bits per frame, allowing fair comparison of information data.
 */
export function runBenchmark({ p = 0.02, frameCount = 2000, seed = 12345 } = {}) {
  if (!Number.isInteger(frameCount) || frameCount < 1 || frameCount > 100000) {
    throw new RangeError("frameCount must be an integer between 1 and 100000.");
  }
  if (typeof p !== "number" || !Number.isFinite(p) || p < 0 || p > 1) {
    throw new RangeError("p must be a number between 0 and 1.");
  }

  // Separate seeded streams make each coding scheme repeatable and prevent
  // one scheme's additional transmitted bits from changing another's input.
  const dataRandom = createSeededRandom(seed);
  const infoBits = randomBits(frameCount * 4, dataRandom);
  const results = [
    evaluateUncoded(infoBits, p, createSeededRandom(seed + 1)),
    evaluateRepetition(infoBits, p, createSeededRandom(seed + 2)),
    evaluateHamming(infoBits, p, createSeededRandom(seed + 3)),
    evaluateSECDED(infoBits, p, createSeededRandom(seed + 4))
  ].map(summarize);

  return { p, frameCount, seed, results };
}
