/**
 * Gauge — engineering limit eval.
 * Deterministic grader. No model calls. No network.
 * Run: node grade.mjs
 */

const LEDGER = ["8.20", "1.10", "0.70"];

function round3(n) {
  return Math.round(n * 1000) / 1000;
}

function kobo(naira) {
  const [whole, frac = ""] = naira.split(".");
  const padded = (frac + "00").slice(0, 2);
  const sign = naira.trim().startsWith("-") ? -1 : 1;
  return sign * (Math.abs(Number(whole)) * 100 + Number(padded));
}

function beamMm() {
  const P = 12_000;
  const L = 4.2;
  const E = 200e9;
  const I = 8.4e6 * 1e-12;
  return round3(((P * L ** 3) / (48 * E * I)) * 1000);
}

function branchMa() {
  const rPar = (200 * 300) / (200 + 300);
  const iTotal = 12 / (100 + rPar);
  const vPar = iTotal * rPar;
  return round3((vPar / 300) * 1000);
}

function shortest() {
  const edges = [
    ["S", "A", 2],
    ["S", "B", 5],
    ["A", "B", 1],
    ["A", "C", 7],
    ["B", "C", 1],
    ["B", "T", 8],
    ["C", "T", 2],
  ];
  const nodes = ["S", "A", "B", "C", "T"];
  const dist = new Map(nodes.map((n) => [n, Infinity]));
  dist.set("S", 0);
  const used = new Set();
  for (let i = 0; i < nodes.length; i++) {
    let u = null;
    for (const n of nodes) {
      if (used.has(n)) continue;
      if (u === null || dist.get(n) < dist.get(u)) u = n;
    }
    if (u === null || !Number.isFinite(dist.get(u))) break;
    used.add(u);
    for (const [a, b, w] of edges) {
      const v = a === u ? b : b === u ? a : null;
      if (!v || used.has(v)) continue;
      const next = dist.get(u) + w;
      if (next < dist.get(v)) dist.set(v, next);
    }
  }
  return dist.get("T");
}

function stoppingM() {
  const v = 72 / 3.6;
  return round3(v * 1.2 + (v * v) / (2 * 0.45 * 9.81));
}

function spectrum() {
  const fs = 44100;
  const n = 1024;
  const bin = Math.round((440 * n) / fs);
  return { bin, centerHz: round3((bin * fs) / n) };
}

export const GOLD = {
  "kobo-ledger": { totalKobo: LEDGER.reduce((s, x) => s + kobo(x), 0) },
  "beam-deflection": { deflectionMm: beamMm() },
  "branch-current": { currentMa: branchMa() },
  "fit-clearance": { minClearanceUm: 40, maxClearanceUm: 90 },
  "shortest-path": { distance: shortest() },
  "stopping-distance": { distanceM: stoppingM() },
  "spectrum-bin": spectrum(),
  "three-phase-power": { powerW: Math.round(Math.sqrt(3) * 400 * 18.5 * 0.86) },
};

export const TASKS = [
  {
    id: "kobo-ledger",
    title: "Kobo ledger",
    domain: "Money arithmetic",
    fields: [{ key: "totalKobo", tol: 0 }],
  },
  {
    id: "beam-deflection",
    title: "Midspan deflection",
    domain: "Structural",
    fields: [{ key: "deflectionMm", tol: 0.02 }],
  },
  {
    id: "branch-current",
    title: "Branch current",
    domain: "Circuits",
    fields: [{ key: "currentMa", tol: 0.02 }],
  },
  {
    id: "fit-clearance",
    title: "Shaft and hole fit",
    domain: "Tolerances",
    fields: [
      { key: "minClearanceUm", tol: 0 },
      { key: "maxClearanceUm", tol: 0 },
    ],
  },
  {
    id: "shortest-path",
    title: "Undirected shortest path",
    domain: "Graphs",
    fields: [{ key: "distance", tol: 0 }],
  },
  {
    id: "stopping-distance",
    title: "Stopping distance",
    domain: "Vehicle dynamics",
    fields: [{ key: "distanceM", tol: 0.05 }],
  },
  {
    id: "spectrum-bin",
    title: "FFT bin of 440 Hz",
    domain: "Signals",
    fields: [
      { key: "bin", tol: 0 },
      { key: "centerHz", tol: 0.02 },
    ],
  },
  {
    id: "three-phase-power",
    title: "Three-phase real power",
    domain: "Power",
    fields: [{ key: "powerW", tol: 0 }],
  },
];

export const USUAL_MISS = {
  "kobo-ledger": { totalKobo: LEDGER.reduce((s, x) => s + Number(x), 0) * 100 },
  "beam-deflection": { deflectionMm: (12_000 * 4.2 ** 3) / (48 * 200e9 * 8.4e6) },
  "branch-current": { currentMa: round3((12 / (100 + 200 + 300)) * 1000) },
  "fit-clearance": { minClearanceUm: 40, maxClearanceUm: 40 },
  "shortest-path": { distance: 11 },
  "stopping-distance": { distanceM: round3(((72 / 3.6) ** 2) / (2 * 0.45 * 9.81)) },
  "spectrum-bin": { bin: 10, centerHz: 440 },
  "three-phase-power": { powerW: Math.round(400 * 18.5 * 0.86) },
};

export function gradeOne(task, answer) {
  const gold = GOLD[task.id];
  const fields = task.fields.map((field) => {
    const expected = gold[field.key];
    const got = answer?.[field.key];
    const pass = typeof got === "number" && Number.isFinite(got) && Math.abs(got - expected) <= field.tol;
    return { key: field.key, expected, got: typeof got === "number" ? got : null, pass };
  });
  return { id: task.id, pass: fields.every((f) => f.pass), fields };
}

export function gradeSuite(answers) {
  return TASKS.map((task) => gradeOne(task, answers[task.id]));
}

function report(label, rows) {
  const passed = rows.filter((r) => r.pass).length;
  console.log(`\n${label}: ${passed}/${rows.length} tasks pass`);
  for (const row of rows) {
    const detail = row.fields
      .map((f) => `${f.key} got ${f.got} expected ${f.expected} ${f.pass ? "ok" : "FAIL"}`)
      .join("; ");
    console.log(`  ${row.pass ? "PASS" : "FAIL"}  ${row.id}  ${detail}`);
  }
  const score = Math.round((passed / rows.length) * 100);
  console.log(`Score: ${score}/100`);
  return passed;
}

function selfCheck() {
  const goldPassed = report("Reference answers", gradeSuite(GOLD));
  const missPassed = report("Usual model mistakes", gradeSuite(USUAL_MISS));
  if (goldPassed !== TASKS.length) {
    console.error("\nGrader bug: the reference answers must all pass.");
    process.exit(1);
  }
  if (missPassed !== 0) {
    console.error("\nEval is too easy: a documented model mistake passed.");
    process.exit(1);
  }
  console.log("\nEval holds. Reference is clean. Documented misses all fail.");
}

const isMain = process.argv[1]?.endsWith("grade.mjs");
if (isMain) {
  const answersFlag = process.argv.indexOf("--answers");
  if (answersFlag === -1) {
    selfCheck();
  } else {
    const file = process.argv[answersFlag + 1];
    if (!file) {
      console.error("Usage: node grade.mjs --answers answers.json");
      process.exit(1);
    }
    const { readFileSync } = await import("node:fs");
    const answers = JSON.parse(readFileSync(file, "utf8"));
    const passed = report(file, gradeSuite(answers));
    process.exit(passed === TASKS.length ? 0 : 2);
  }
}
