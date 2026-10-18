# CodeShield — Final Project Folder

CodeShield is an interactive coding-theory lab with a dark responsive UI. This is the complete project folder; keep the files together.

## Start the website (Windows)

**Easy option**
1. Extract this folder.
2. Double-click `START-CODESHIELD.bat`.
3. Your browser should open CodeShield at `http://localhost:8000`.
4. Keep the terminal window open while using the site. Close that window to stop the local server.

The launcher uses Python's built-in HTTP server. If Python is unavailable, open the folder in VS Code and run `index.html` with the **Live Server** extension instead.

## Run automated tests

Install Node.js LTS if needed. Open this folder in VS Code, open Terminal, and run:

```bash
npm test
```

## Included features

- Hamming (7,4) encoding, syndrome decoding, and single-bit correction
- Interactive bit flipping and random error injection
- Extended Hamming (8,4) SECDED: single-error correction and double-error detection
- Contiguous burst-error injection
- Binary Symmetric Channel (BSC) simulations
- Empirical comparison of uncoded, repetition (3,1), and Hamming (7,4)
- BER before/after decoding, frame error rate, code rate, and overhead
- Seeded reproducible experiments and CSV export
- Automated tests for codewords, correction/detection, channels, and experiments

## Important research limitation

SECDED guarantees correction of a single-bit error and detection of a double-bit error under the standard decoding assumptions. Three-or-more-bit errors are not guaranteed to be detected correctly. Benchmark numbers are finite-sample empirical estimates, not universal guarantees.


## Adaptive selector (research prototype)

The Research Contribution section evaluates Uncoded, Repetition (3,1), Hamming (7,4), and Extended Hamming SECDED (8,4) on a seeded Binary Symmetric Channel. It filters candidates by the selected **observed frame-error-rate target** and **maximum redundancy**, then selects the eligible code with the lowest overhead. If no candidate meets both constraints, it reports no feasible candidate instead of silently relaxing constraints.

Metrics are finite-sample empirical estimates, not reliability guarantees. Repeat experiments across seeds, frame counts, and channel probabilities before using results in a report. In SECDED benchmarking, detected double-error frames use the received systematic data bits for residual-BER accounting; the simulator does not claim those frames were recovered.

Run the tests with `npm test`; all 23 tests should pass.
