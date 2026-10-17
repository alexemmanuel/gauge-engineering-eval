# Gauge — engineering limit eval

An eval that measures whether a model can finish small engineering calculations without the mistakes working engineers get punished for: unit slips, the wrong formula, and a path that looks cheap but is not shortest.

This is not an agent, a product demo, or a benchmark of coding speed. Each task has one defensible numeric answer. A grader checks it. No second model is in the loop.

## Who it is for

Engineers and anyone judging frontier models on applied calculation: structures, circuits, tolerances, graphs, vehicle dynamics, signals, and three-phase power.

## Why it matters

Models often sound fluent on engineering prompts and still return a number that would be unsafe or unpaid in practice. These eight tasks are short on purpose. The failure is not “the problem was too long.” The failure is a specific, common shortcut:

| Task | What a correct answer requires | Usual miss |
| --- | --- | --- |
| Kobo ledger | Integer kobo, not binary floats | `8.20 + 1.10 + 0.70` then `× 100` is 999.999…, not 1000 |
| Midspan deflection | `I` converted from mm⁴ to m⁴ (`× 10⁻¹²`) | Leaves `I` in mm⁴, so deflection collapses |
| Branch current | Current divider on the parallel pair | Treats 100, 200, and 300 Ω as one series string |
| Shaft and hole | Worst-case pairing of limits | Reports the nominal gap for both min and max |
| Shortest path | `S–A–B–C–T` = 6 | Walks `S–A–C–T` = 11 and stops |
| Stopping distance | Reaction distance plus braking, speed in m/s | Drops the 1.2 s reaction distance |
| FFT bin | Nearest bin of 440 Hz at 44.1 kHz, N = 1024, then that bin’s centre | Reports 440 Hz as if it sat on a bin centre |
| Three-phase power | `P = √3 · V_L · I_L · pf` | Uses the single-phase formula and drops `√3` |

## How to run

Requires Node.js 18 or newer. No install. No API key. No network.

```bash
node grade.mjs
```

Expected output:

- Reference answers: 8/8 pass
- Usual model mistakes: 0/8 pass
- Process exit code 0

Exit code 1 means the grader itself is wrong (a reference failed, or a documented miss passed). That is a harness bug, not a model score.

## How to score a model

1. Give the model one task prompt (see the Gauge app, or the prompts below).
2. Require a single JSON object. No prose is graded.
3. Put the parsed object in a file `answers.json` shaped as `{ "<task-id>": { ...fields } }`.
4. Run:

```bash
node grade.mjs --answers answers.json
```

A task passes only when every field is within its tolerance. Tolerances are 0 for integer results and a few hundredths for rounded decimals, so a unit error cannot sneak through.

## Prompts

Prompts ask for JSON only. They are also listed in the Gauge preview, which uses this same math.

1. **kobo-ledger** — Sum `8.20`, `1.10`, `0.70` naira as integer kobo. `{"totalKobo": <integer>}`
2. **beam-deflection** — Simply supported beam, midspan point load, `δ = PL³/(48EI)`. `P = 12 kN`, `L = 4.2 m`, `E = 200 GPa`, `I = 8.4×10⁶ mm⁴`. Deflection in mm to 3 d.p. `{"deflectionMm": <number>}`
3. **branch-current** — 12 V, `100 Ω` in series with `200 Ω || 300 Ω`. Current through the 300 Ω branch in mA to 3 d.p. `{"currentMa": <number>}`
4. **fit-clearance** — Hole `20.00 / +0.02 / −0.00` mm, shaft `19.96 / +0.00 / −0.03` mm. Min and max clearance in µm. `{"minClearanceUm": <integer>, "maxClearanceUm": <integer>}`
5. **shortest-path** — Undirected edges `S–A 2, S–B 5, A–B 1, A–C 7, B–C 1, B–T 8, C–T 2`. Distance `S` to `T`. `{"distance": <number>}`
6. **stopping-distance** — 72 km/h, `μ = 0.45`, `g = 9.81`, reaction `1.2 s`. Metres to 3 d.p. `{"distanceM": <number>}`
7. **spectrum-bin** — Real FFT, `fs = 44100`, `N = 1024`, tone `440 Hz`. Nearest bin and that bin’s centre Hz. `{"bin": <integer>, "centerHz": <number>}`
8. **three-phase-power** — `400 V` line, `18.5 A` line, `pf = 0.86`. Integer watts, half away from zero. `{"powerW": <integer>}`

## What this does not claim

- It does not call a frontier model. Documented misses are the failure modes the tasks are built to catch. Run your own model and pass its JSON to the grader.
- It does not use private or employer data. Every input is synthetic.
- It does not grade writing quality, only the numbers.

## Reproduce

Runtime is a few milliseconds. Cost is zero. Dependencies: none.
