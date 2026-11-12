// Financial Needs Analysis: the data a booth visitor's analysis holds and
// the arithmetic behind it. Shared by the public booth page (which fills it
// in) and the dashboard's Booth screen (which shows it back read-only).
//
// The value keys, question keys and option ids are mirrored in
// amplify/functions/public-rsvp/handler.ts, which rebuilds every saved
// analysis from them — keep the two in step.

export const VALUE_KEYS = [
  "debt", "inc", "years", "mortgage", "eduCost", "eduYears", "kids",
  "savings", "stocks", "realEstate", "insurance", "metals", "crypto", "k401",
] as const;
export type ValueKey = typeof VALUE_KEYS[number];

// Shown as plain counts ("4"), not as money ("4,000").
export const COUNT_KEYS: ValueKey[] = ["years", "eduYears", "kids"];

export const ASSETS: [ValueKey, string][] = [
  ["savings", "Bank savings"],
  ["stocks", "Stocks"],
  ["realEstate", "Real estate"],
  ["insurance", "Insurance"],
  ["metals", "Gold / silver / precious metals"],
  ["crypto", "Crypto"],
  ["k401", "401(k)"],
];

export const QUESTIONS = [
  { key: "q1", text: "Do you agree that this is an important problem to solve?" },
  { key: "q2", text: "If this is not solved, where will the mortgage and bills come from?" },
  { key: "q3", text: "How important is it for you to solve it?" },
  { key: "q4", text: "Do you agree protecting your family is important?" },
  { key: "q5", text: "The plan will pay off mortgage and replace the income if something happens. Does this solve the problem we talked about?" },
  { key: "q6", text: "Is there any advantage for you to wait?" },
] as const;
export type QuestionKey = typeof QUESTIONS[number]["key"];
// The questions the booth page asks now. q5/q6 and the A/B/C options were
// dropped in favour of booking a meeting; older entries may still hold them.
export const ASKED: QuestionKey[] = ["q1", "q2", "q3", "q4"];

export type YesNo = "Y" | "N";
export type OptionId = "A" | "B" | "C";
export const OPTION_IDS: OptionId[] = ["A", "B", "C"];

export interface Analysis {
  v: Record<ValueKey, number>;
  p1: string;
  p2: string;
  // Person 1's income share in percent; person 2 has the rest.
  r1: number;
  ans: Partial<Record<QuestionKey, YesNo>>;
  booked: boolean;
  // Chosen option per person: [person 1, person 2]; "" = none yet.
  choice: [OptionId | "", OptionId | ""];
}

export function emptyAnalysis(): Analysis {
  return {
    v: { debt: 0, inc: 0, years: 10, mortgage: 0, eduCost: 40000, eduYears: 4, kids: 0, savings: 0, stocks: 0, realEstate: 0, insurance: 0, metals: 0, crypto: 0, k401: 0 },
    p1: "Husband",
    p2: "Wife",
    r1: 50,
    ans: {},
    booked: false,
    choice: ["", ""],
  };
}

// Tolerates a missing or partial saved analysis (older rows, a bad parse).
export function parseAnalysis(raw: string | null | undefined): Analysis {
  const base = emptyAnalysis();
  if (!raw) return base;
  try {
    const a = JSON.parse(raw);
    return {
      v: { ...base.v, ...(a?.v || {}) },
      p1: typeof a?.p1 === "string" ? a.p1 : base.p1,
      p2: typeof a?.p2 === "string" ? a.p2 : base.p2,
      r1: typeof a?.r1 === "number" ? a.r1 : base.r1,
      ans: a?.ans && typeof a.ans === "object" ? a.ans : {},
      booked: !!a?.booked,
      choice: Array.isArray(a?.choice) ? [a.choice[0] || "", a.choice[1] || ""] : ["", ""],
    };
  } catch {
    return base;
  }
}

export const fmtMoney = (n: number, cur = "$") => (n < 0 ? "−" : "") + cur + Math.round(Math.abs(n)).toLocaleString("en-US");

export interface OptionRow { id: OptionId; term: number; termNote: string; perm: number | null; permNote: string }

export function computeAnalysis(a: Analysis) {
  const v = a.v;
  const incomeRep = v.inc * v.years;
  const perKid = v.eduCost * v.eduYears;
  const edu = perKid * v.kids;
  const liabilities = v.debt + incomeRep + v.mortgage + edu;
  const assets = ASSETS.reduce((t, [k]) => t + v[k], 0);
  const raw = liabilities - assets;
  const responsibility = Math.max(0, raw);
  const share1 = Math.min(100, Math.max(0, a.r1)) / 100;
  const shares = [share1, 1 - share1];
  const names = [a.p1, a.p2];

  const people = [0, 1].map(i => {
    const resp = responsibility * shares[i];
    // Option B ladders term cover over what has a natural end date
    // (mortgage + education) and puts the rest in permanent.
    const ladder = Math.min(resp, (v.mortgage + edu) * shares[i]);
    const options: OptionRow[] = [
      { id: "A", term: resp * 0.5, termNote: "50% term", perm: resp * 0.5, permNote: "50% permanent" },
      { id: "B", term: ladder, termNote: "Laddered: mortgage + education", perm: resp - ladder, permNote: "Remaining in permanent" },
      { id: "C", term: resp, termNote: "100% term", perm: null, permNote: "" },
    ];
    return { name: names[i], share: shares[i], resp, options, choice: a.choice[i] };
  });

  return { incomeRep, perKid, edu, liabilities, assets, surplus: raw < 0 ? -raw : 0, responsibility, people };
}
