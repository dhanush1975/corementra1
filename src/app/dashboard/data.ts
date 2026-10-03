import type { Agent, Client, Db, EventRecord, Feedback, FollowUp, IncomeData, PartnerIncome, Product, Prospect, Purchase, Sale, Stage } from "./types";

export const STAGES: Stage[] = ["NEW", "CONTACTED", "APPOINTMENT", "IN PROCESS", "CONVERTED", "NOT INTERESTED"];
export const STAGE_TITLES: Record<Stage, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  APPOINTMENT: "Appointment",
  "IN PROCESS": "In progress",
  CONVERTED: "Converted",
  "NOT INTERESTED": "Not interested",
};
export const NEEDS = ["Not captured yet", "Estate Planning", "Life Insurance", "Health / Disability", "Family Protection", "College", "Retirement", "Tax-Free Income", "IRA / 401(k)", "Risk Protection"];
export const SOURCES = ["Not captured yet", "Event / Workshop", "Friend / Relative", "Met in person", "Business Associate", "Booth", "Referral", "Phone / inbound call", "Social media"];
export const AGENT_NAMES = ["Marcus Reyes", "Dana Whitfield", "Priya Shah"];
export const REGIONS = ["North", "South", "East", "West", "Central"];
export const KINDS = ["Not decided yet", "Prospect", "Client"] as const;
export const PLANS = ["Not decided yet", "Term life", "Whole life", "Indexed universal life", "IRA rollover", "401(k) rollover", "Annuity", "Disability income", "College savings plan", "Estate plan review"];
export const PROD_CATS = ["Life Insurance", "Annuity", "Money Management", "Alternative Investments"];
export const RANKS = [
  { name: "Associate", min: 0 },
  { name: "Senior Associate", min: 500 },
  { name: "Team Lead", min: 1500 },
  { name: "Regional Director", min: 4000 },
  { name: "Executive Director", min: 10000 },
];
export const INC_PERIODS = ["This month", "Last 3 months", "Last 12 months", "All time"];

export const uid = () => Math.random().toString(36).slice(2, 9);
export const money = (v: number) => "$" + Math.round(Number(v) || 0).toLocaleString();
export const usd2 = (v: number) => "$" + (Number(v) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const pct4 = (n: number) => (Number(n) || 0).toFixed(4) + "%";
export const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 + "%" : "—");
export const today = () => new Date().toISOString().slice(0, 10);
export const shortDate = (d?: string) => (d ? new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—");
export const shortTime = (t?: string) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
};
export const dayDiff = (d: string) => Math.round((new Date(d + "T00:00:00").getTime() - new Date(today() + "T00:00:00").getTime()) / 86400000);

const pad2 = (n: number) => String(n).padStart(2, "0");
export const toDateStr = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

// Always 42 cells (6 full weeks) so the grid height never jumps between
// months. Shared by the Calendar screen and the DateTimePicker popover.
export function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { date: Date; dateStr: string; inMonth: boolean }[] = [];
  for (let i = first.getDay(); i > 0; i--) {
    const d = new Date(year, month, 1 - i);
    cells.push({ date: d, dateStr: toDateStr(d), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    cells.push({ date: dt, dateStr: toDateStr(dt), inMonth: true });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const d = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
    cells.push({ date: d, dateStr: toDateStr(d), inMonth: false });
  }
  return cells;
}
export const initials = (n?: string) => String(n || "").split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
export const plainVal = (v: string | undefined) => (["Not captured yet", "Not decided yet", "", undefined].includes(v) ? "" : v);

// A record just marked complete/converted stays on its board for 24h, then
// drops off (Table view still shows it — nothing is deleted). Records with
// no completedAt (pre-dating this feature, or never timestamped) count as
// already stale so old clutter clears immediately rather than piling up.
const DAY_MS = 24 * 60 * 60 * 1000;
export const isFresh = (completedAt?: string) => !!completedAt && Date.now() - new Date(completedAt).getTime() < DAY_MS;

// Org-chart traversal. `visited` guards against a cyclic uplineId graph
// (self-reference, or two agents each pointing to the other) — without it,
// a single bad edge sends this into infinite recursion / stack overflow on
// every render that touches the Agents screen.
export function directsOf(agents: Agent[], name: string) {
  const me = agents.find(a => a.name === name);
  if (!me) return [];
  return agents.filter(a => a.uplineId === me.id && a.name !== name).map(a => a.name);
}
export function branchOf(agents: Agent[], name: string): string[] {
  const out: string[] = [];
  const visited = new Set<string>();
  const walk = (n: string) => {
    if (visited.has(n)) return;
    visited.add(n);
    out.push(n);
    directsOf(agents, n).forEach(walk);
  };
  walk(name);
  return out;
}

export function seed(): Db {
  const ev: EventRecord[] = [
    { id: "e1", name: "Retirement Workshop", date: "2026-09-05", location: "Dallas — Community Hall", timeFrame: "6–8 PM", expense: 1200, status: "Completed", registered: 58, attended: 42 },
    { id: "e2", name: "Financial Planning Event", date: "2026-09-12", location: "Plano — Office Suite 200", timeFrame: "6:30–8:30 PM", expense: 1850, status: "Completed", registered: 80, attended: 65 },
    { id: "e3", name: "Community Seminar", date: "2026-09-19", location: "Irving — Library Annex", timeFrame: "5–7 PM", expense: 900, status: "Upcoming", registered: 46, attended: 0 },
    { id: "e4", name: "Business Opportunity Night", date: "2026-10-03", location: "Dallas — HQ", timeFrame: "7–9 PM", expense: 700, status: "Upcoming", registered: 12, attended: 0 },
  ];
  const prRaw: [string, string, string, string, string, string, string, Stage, string, string][] = [
    ["John Smith", "j.smith@mail.com", "(214) 555-0118", "e1", "Event / Workshop", "Retirement", AGENT_NAMES[0], "NEW", "2026-09-06", "Wants IRA rollover review."],
    ["Maria Lopez", "maria.l@mail.com", "(214) 555-0146", "e1", "Booth", "Life Insurance", AGENT_NAMES[2], "NEW", "2026-09-09", "Booth sign-up, no contact yet."],
    ["Darren Cole", "dcole@mail.com", "(469) 555-0177", "e1", "Friend / Relative", "Family Protection", AGENT_NAMES[0], "CONTACTED", "2026-09-11", "Prefers evening appointments."],
    ["Priya Raman", "priya.r@mail.com", "(972) 555-0132", "e2", "Event / Workshop", "College", AGENT_NAMES[1], "APPOINTMENT", "2026-09-14", "Presentation booked."],
    ["Tom Becker", "tbecker@mail.com", "(817) 555-0190", "e2", "Business Associate", "Health / Disability", AGENT_NAMES[1], "IN PROCESS", "2026-09-13", "Application in underwriting."],
    ["Angela Wu", "a.wu@mail.com", "(214) 555-0155", "e1", "Event / Workshop", "Tax-Free Income", AGENT_NAMES[0], "IN PROCESS", "2026-09-15", "Paperwork sent."],
    ["Chris Nolan", "c.nolan@mail.com", "(469) 555-0101", "e2", "Event / Workshop", "Estate Planning", AGENT_NAMES[2], "CONVERTED", "2026-09-01", "Joined as partner after HOP."],
    ["Susan Reed", "s.reed@mail.com", "(214) 555-0166", "e1", "Event / Workshop", "Retirement", AGENT_NAMES[0], "CONVERTED", "2026-09-02", "Term life + IRA rollover."],
    ["Ken Arai", "k.arai@mail.com", "(972) 555-0173", "e2", "Friend / Relative", "Life Insurance", AGENT_NAMES[1], "CONVERTED", "2026-09-04", "Whole life policy."],
    ["Hector Diaz", "hdiaz@mail.com", "(469) 555-0120", "e1", "Event / Workshop", "College", AGENT_NAMES[2], "CONTACTED", "2026-09-08", "Attendee, still qualifying."],
    ["Lisa Grant", "l.grant@mail.com", "(817) 555-0144", "e2", "Business Associate", "Risk Protection", AGENT_NAMES[0], "CONVERTED", "2026-09-03", "Recruited as partner."],
    ["Nadia Farouk", "n.farouk@mail.com", "(214) 555-0187", "e3", "Referral", "IRA / 401(k)", AGENT_NAMES[1], "NOT INTERESTED", "2026-09-10", "Asked to be removed from list."],
  ];
  const pr: Prospect[] = prRaw.map(r => ({
    id: uid(), name: r[0], email: r[1], phone: r[2], eventId: r[3], source: r[4], need: r[5], agent: r[6],
    stage: r[7], lastContact: r[8], notes: r[9], kind: "Prospect", plan: "Not decided yet",
  }));
  const clRaw: [string, string, string, string, "Client" | "Partner", string, string, string][] = [
    ["Susan Reed", "s.reed@mail.com", "(214) 555-0166", "118 Oak St, Dallas TX", "Client", AGENT_NAMES[0], "Event / Workshop", "2026-09-02"],
    ["Ken Arai", "k.arai@mail.com", "(972) 555-0173", "42 Elm Ave, Plano TX", "Client", AGENT_NAMES[1], "Friend / Relative", "2026-09-04"],
    ["Chris Nolan", "c.nolan@mail.com", "(469) 555-0101", "7 Cedar Rd, Irving TX", "Partner", AGENT_NAMES[2], "Event / Workshop", "2026-09-01"],
    ["Lisa Grant", "l.grant@mail.com", "(817) 555-0144", "90 Birch Ln, Arlington TX", "Partner", AGENT_NAMES[0], "Business Associate", "2026-09-03"],
    ["Omar Haddad", "o.haddad@mail.com", "(214) 555-0199", "5 Pine Ct, Dallas TX", "Client", AGENT_NAMES[1], "Booth", "2026-08-26"],
    ["Grace Mbeki", "g.mbeki@mail.com", "(469) 555-0112", "61 Maple Dr, Frisco TX", "Client", AGENT_NAMES[2], "Event / Workshop", "2026-08-30"],
  ];
  const cl: Client[] = clRaw.map(r => ({ id: uid(), name: r[0], email: r[1], phone: r[2], address: r[3], type: r[4], agent: r[5], source: r[6], since: r[7] }));
  const byName = (n: string) => cl.find(c => c.name === n)?.id || "";
  const puRaw: [string, string, string, number][] = [
    ["Susan Reed", "Term life + IRA rollover", "2026-09-02", 48000],
    ["Ken Arai", "Whole life", "2026-09-04", 31500],
    ["Chris Nolan", "Fast Start production", "2026-09-08", 62000],
    ["Lisa Grant", "Indexed universal life", "2026-09-05", 55000],
    ["Omar Haddad", "Disability income", "2026-08-27", 22400],
    ["Grace Mbeki", "401(k) risk protection", "2026-08-31", 39000],
  ];
  const pu: Purchase[] = puRaw.map(r => ({ id: uid(), clientId: byName(r[0]), product: r[1], date: r[2], businessValue: r[3], agentPct: 10 }));
  const pid = (n: string) => pr.find(p => p.name === n)?.id || "";
  const fuRaw: [string, "Call" | "Email" | "Appointment" | "Task", string, "Open" | "Completed", string, string][] = [
    ["Darren Cole", "Call", today(), "Open", "Confirm evening appointment slot", AGENT_NAMES[0]],
    ["Priya Raman", "Appointment", today(), "Open", "Send presentation pre-read", AGENT_NAMES[1]],
    ["Angela Wu", "Call", today(), "Open", "Paperwork questions", AGENT_NAMES[0]],
    ["Maria Lopez", "Call", "2026-09-14", "Open", "First contact never logged", AGENT_NAMES[2]],
    ["Hector Diaz", "Email", "2026-09-12", "Open", "Qualify after workshop", AGENT_NAMES[2]],
    ["Tom Becker", "Call", "2026-09-18", "Open", "Underwriting status update", AGENT_NAMES[1]],
    ["John Smith", "Call", "2026-09-22", "Open", "Post-workshop follow-up", AGENT_NAMES[0]],
    ["Chris Nolan", "Appointment", "2026-09-24", "Open", "Prospect list review", AGENT_NAMES[2]],
    ["Susan Reed", "Call", "2026-09-09", "Completed", "Annual review done", AGENT_NAMES[0]],
  ];
  const fu: FollowUp[] = fuRaw.map(r => ({ id: uid(), prospectId: pid(r[0]), subject: r[0], type: r[1], dueDate: r[2], status: r[3], note: r[4], agent: r[5] }));
  const fbRaw: [string, number, string, string][] = [
    ["Susan Reed", 5, "The needs analysis was clear and nothing was rushed.", "2026-09-14"],
    ["Ken Arai", 5, "Good follow-up. I knew the next step each time.", "2026-09-11"],
    ["Omar Haddad", 4, "Wanted more detail on the college funding options.", "2026-09-09"],
    ["Grace Mbeki", 5, "Straightforward and professional.", "2026-09-06"],
  ];
  const fb: Feedback[] = fbRaw.map(r => ({ id: uid(), clientId: byName(r[0]), rating: String(r[1]), comment: r[2], date: r[3] }));
  const ag: Agent[] = [
    { id: "a1", name: "Marcus Reyes", uplineId: "", title: "Regional director", email: "marcus.reyes@company.com", phone: "(214) 555-0100", joined: "2024-01-15", region: "North", status: "Active" },
    { id: "a2", name: "Dana Whitfield", uplineId: "a1", title: "Senior associate", email: "dana.whitfield@company.com", phone: "(214) 555-0101", joined: "2025-03-02", region: "South", status: "Active" },
    { id: "a3", name: "Priya Shah", uplineId: "a2", title: "Associate", email: "priya.shah@company.com", phone: "(214) 555-0102", joined: "2026-02-10", region: "East", status: "Active" },
    { id: "a4", name: "Leah Fontaine", uplineId: "a1", title: "Senior associate", email: "leah.fontaine@company.com", phone: "(214) 555-0103", joined: "2025-05-20", region: "West", status: "Active" },
    { id: "a5", name: "Omar Delgado", uplineId: "a4", title: "Associate", email: "omar.delgado@company.com", phone: "(214) 555-0104", joined: "2026-01-08", region: "North", status: "Active" },
    { id: "a6", name: "Grace Lindqvist", uplineId: "a2", title: "Associate", email: "grace.lindqvist@company.com", phone: "(214) 555-0105", joined: "2025-11-14", region: "Central", status: "Inactive" },
    { id: "a7", name: "Victor Osei", uplineId: "a1", title: "Senior associate", email: "victor.osei@company.com", phone: "(214) 555-0106", joined: "2025-07-01", region: "East", status: "Active" },
    { id: "a8", name: "Nadia Kessler", uplineId: "a7", title: "Associate", email: "nadia.kessler@company.com", phone: "(214) 555-0107", joined: "2026-03-19", region: "South", status: "Active" },
  ];
  return { events: ev, prospects: pr, clients: cl, purchases: pu, followUps: fu, feedback: fb, agents: ag };
}

export const EMPTY_DB: Db = { events: [], prospects: [], clients: [], purchases: [], followUps: [], feedback: [], agents: [] };

const DB_KEY = "crm.model.v1";

export function loadDb(): Db {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const d = { ...EMPTY_DB, ...JSON.parse(raw) } as Db;
      d.prospects = d.prospects.map(p => (p.kind ? p : { ...p, kind: "Prospect" as const }));
      if (!d.agents || !d.agents.length) d.agents = seed().agents;
      return d;
    }
  } catch {
    // fall through to seed
  }
  const s = seed();
  try { localStorage.setItem(DB_KEY, JSON.stringify(s)); } catch { /* storage unavailable */ }
  return s;
}

export function saveDb(db: Db) {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch { /* storage unavailable */ }
}

const PROD_KEY = "crm-products-v3";
const PROD_SEED_RAW: [string, string, string, number, number][] = [
  ["Annuity", "ALLIANZ ANNUITIES", "222/360/Benefit Control 10 Yr Fixed Annuity (0-75)", 4.813, 100.0],
  ["Annuity", "ALLIANZ ANNUITIES", "222/360/Benefit Control 10 Yr Fixed Annuity (76-80)", 3.713, 100.0],
  ["Annuity", "ALLIANZ ANNUITIES", "Accum Advantage 10 Yr Fixed Annuity (0-75)", 5.524, 100.0],
  ["Annuity", "ALLIANZ ANNUITIES", "Accum Advantage 10 Yr Fixed Annuity (76-80)", 4.05, 100.0],
  ["Annuity", "ALLIANZ ANNUITIES", "Accum Advantage 5 Yr Fixed Annuity (0-75)", 2.55, 100.0],
  ["Annuity", "ALLIANZ ANNUITIES", "Accum Advantage 5 Yr Fixed Annuity (76-80)", 1.95, 100.0],
  ["Annuity", "ALLIANZ ANNUITIES", "Accum Advantage 7 Yr Fixed Annuity (0-75)", 4.2, 100.0],
  ["Annuity", "ALLIANZ ANNUITIES", "Accum Advantage 7 Yr Fixed Annuity (76-85)", 3.3, 100.0],
  ["Annuity", "ALLIANZ ANNUITIES", "Core Income 7 Year Fixed Annuity (0-75)", 3.9, 100.0],
  ["Annuity", "ALLIANZ ANNUITIES", "Core Income 7 Year Fixed Annuity (76-80)", 3.0, 100.0],
  ["Life Insurance", "ALLIANZ LIFE", "Accumulator IUL", 86.994, 100.0],
  ["Annuity", "AMERICAN EQUITY", "AssetShield 10 (18-75)-(BI)", 4.423, 100.0],
  ["Annuity", "AMERICAN EQUITY", "AssetShield 10 (76 - 80) - (BI)", 3.32, 100.0],
  ["Annuity", "AMERICAN EQUITY", "AssetShield 5 (18 - 75) - (BI)", 2.601, 100.0],
  ["Annuity", "AMERICAN EQUITY", "AssetShield 5 (76 - 80) - (BI)", 1.951, 100.0],
  ["Annuity", "AMERICAN EQUITY", "AssetShield 5 (81 - 85) - (BI)", 1.301, 100.0],
  ["Annuity", "AMERICAN EQUITY", "AssetShield 7 (18 - 75) - (BI)", 3.122, 100.0],
  ["Annuity", "AMERICAN EQUITY", "AssetShield 7 (76 - 80) - (BI)", 2.341, 100.0],
  ["Annuity", "AMERICAN EQUITY", "AssetShield 7 (81 - 85) - (BI)", 1.561, 100.0],
  ["Annuity", "AMERICAN EQUITY", "AssetShield 9 (18 - 75) - (BI)", 4.423, 100.0],
  ["Annuity", "AMERICAN EQUITY", "AssetShield 9 (76 - 80) - (BI)", 3.32, 100.0],
  ["Annuity", "AMERICAN EQUITY", "AssetShield Bonus 5 (18-75) - (BI)", 2.992, 100.0],
  ["Annuity", "AMERICAN EQUITY", "AssetShield Bonus 9 & 10 (18-75) - (BI)", 4.423, 100.0],
  ["Annuity", "AMERICAN EQUITY", "AssetShield Bonus 9 & 10 (76-80) - (BI)", 3.32, 100.0],
  ["Annuity", "AMERICAN EQUITY", "Balance Shield (18-75)", 4.423, 100.0],
  ["Annuity", "AMERICAN EQUITY", "Balance Shield (76-80)", 3.32, 100.0],
  ["Annuity", "AMERICAN EQUITY", "Estate Shield 9 & 10 (Age 40 - 75) - (BI)", 4.423, 100.0],
  ["Annuity", "AMERICAN EQUITY", "FlexShield 10 (18-75) - (BI)", 3.902, 100.0],
  ["Annuity", "AMERICAN EQUITY", "FlexShield 10 (76-80) - (BI)", 2.929, 100.0],
  ["Annuity", "AMERICAN EQUITY", "IncomeShield 10 Option A (18-75) - (BI)", 3.434, 100.0],
  ["Annuity", "AMERICAN EQUITY", "IncomeShield 10 Option A (76-80) - (BI)", 2.575, 100.0],
  ["Annuity", "AMERICAN EQUITY", "IncomeShield 10 Option U (18-75) - (BI)", 4.475, 100.0],
  ["Annuity", "AMERICAN EQUITY", "IncomeShield 10 Option U (76-80) - (BI)", 3.46, 100.0],
  ["Annuity", "AMERICAN EQUITY", "IncomeShield 7 Option A (18-75) - (BI)", 2.914, 100.0],
  ["Annuity", "AMERICAN EQUITY", "IncomeShield 7 Option A (76-80) - (BI)", 2.185, 100.0],
  ["Annuity", "AMERICAN EQUITY", "IncomeShield 7 Option U (40-75) - (BI)", 3.434, 100.0],
  ["Annuity", "AMERICAN EQUITY", "IncomeShield 9 - CA Option A (18-75) - (BI)", 3.434, 100.0],
  ["Annuity", "AMERICAN EQUITY", "IncomeShield 9 - CA Option A (76-80) - (BI)", 2.575, 100.0],
  ["Annuity", "AMERICO ANNUITIES (ANNEXUS)", "Benchmark Flex & Flex Plus (0-75)", 6.237, 100.0],
  ["Annuity", "AMERICO ANNUITIES (ANNEXUS)", "Benchmark Flex & Flex Plus (76-80)", 5.586, 100.0],
  ["Annuity", "AMERICO ANNUITIES (ANNEXUS)", "Benchmark Flex & Flex Plus (81-85)", 3.646, 100.0],
  ["Life Insurance", "AMERITAS", "Access WL", 91.539, 75.0],
  ["Life Insurance", "AMERITAS", "Access WL - (NY)", 62.499, 75.0],
  ["Life Insurance", "AMERITAS", "ClearEdge Living Benefits 10 Year Term", 81.0, 75.0],
  ["Life Insurance", "AMERITAS", "ClearEdge Living Benefits 15 Year Term", 84.0, 75.0],
  ["Life Insurance", "AMERITAS", "ClearEdge Living Benefits 20-30 Year Term", 91.2, 75.0],
  ["Life Insurance", "AMERITAS", "Cornerstone Guaranteed Standard Disability", 72.599, 75.0],
  ["Life Insurance", "AMERITAS", "Cornerstone Noncancelable Disability", 78.913, 75.0],
  ["Life Insurance", "AMERITAS", "DInamic Foundation Guaranteed Standard Disability", 72.599, 75.0],
  ["Life Insurance", "AMERITAS", "DInamic Foundation Noncancelable Disability", 78.913, 75.0],
  ["Life Insurance", "AMERITAS", "DInamic Fundamental Guaranteed Renewable Disability", 72.599, 75.0],
  ["Life Insurance", "AMERITAS", "Growth 10 Pay WL", 41.034, 75.0],
  ["Life Insurance", "AMERITAS", "Growth 10 Pay WL - (NY)", 42.297, 75.0],
  ["Life Insurance", "AMERITAS", "Growth Index UL", 91.539, 75.0],
  ["Life Insurance", "AMERITAS", "Growth WL", 91.539, 75.0],
  ["Life Insurance", "AMERITAS", "Growth WL - (NY)", 62.499, 75.0],
  ["Life Insurance", "AMERITAS", "Survivor IUL - (NY)", 57.448, 75.0],
  ["Life Insurance", "AMERITAS", "VP Term 10 - 15yr - (NY)", 57.9, 75.0],
  ["Life Insurance", "AMERITAS", "VP Term 15T", 72.0, 75.0],
  ["Life Insurance", "AMERITAS", "VP Term 1T", 63.0, 75.0],
  ["Life Insurance", "AMERITAS", "VP Term 20 - 30yr - (NY)", 59.4, 75.0],
  ["Life Insurance", "AMERITAS", "VP Term 20T - 30T", 73.5, 75.0],
  ["Life Insurance", "AMERITAS", "Value Plus Index UL", 91.539, 75.0],
  ["Life Insurance", "AMERITAS", "Value Plus Survivor Index UL", 91.539, 75.0],
  ["Life Insurance", "AMERITAS", "Value Plus UL", 91.539, 75.0],
  ["Life Insurance", "AMERITAS", "Value Plus WL", 91.539, 75.0],
  ["Life Insurance", "AMERITAS", "Value Plus WL - (NY)", 62.499, 75.0],
  ["Annuity", "ATHENE ANNUITIES", "AccuMax 7 (0-70) (BI)", 3.648, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "Agility 10 (0-70) (BI)", 5.396, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "Agility 10 (71-75) (BI)", 5.096, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "Agility 10 (76-80) (BI)", 4.496, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "Agility 7 (0-70) (BI)", 3.433, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "Agility 7 (71-75) (BI)", 3.134, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "Agility 7 (76-80) (BI)", 2.836, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "Agility 7 (80+) (BI)", 2.537, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "Ascent Pro 10 Bonus (0-70) (BI)", 5.469, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "Ascent Pro 10 Bonus (71-75) (BI)", 5.165, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "Ascent Pro 10 Bonus (76-80) (BI)", 4.558, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "Athene Activate (Option 1 - 10+)", 2.462, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "Aviator 10 (0-70) (BI)", 5.469, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "Aviator 10 (71-75) (BI)", 5.165, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "Aviator 10 (76-80) (BI)", 4.558, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "Aviator 5 (0-70) (BI)", 3.039, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "Aviator 5 (71-75) (BI)", 2.735, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "Aviator 5 (76-80) (BI)", 2.552, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "Aviator 5 (81+) (BI)", 2.036, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "MaxRate 3 (0-75) (BI)", 1.185, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "MaxRate 3 (76-80) (BI)", 0.851, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "MaxRate 3 (81+) (BI)", 0.456, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "MaxRate 5 (0-75) (BI)", 1.59, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "MaxRate 5 (76-80) (BI)", 1.422, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "MaxRate 5 (81+) (BI)", 0.912, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "MaxRate 7 (0-75) (BI)", 1.89, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "MaxRate 7 (76-80) (BI)", 1.716, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "MaxRate 7 (81+) (BI)", 1.062, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "Performance Elite 10 (0-70) (BI)", 5.469, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "Performance Elite 10 (71-75) (BI)", 5.165, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "Performance Elite 10 (76-78) (BI)", 4.558, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "Performance Elite 15 (0-70) (BI)", 6.313, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "Performance Elite 15 (71-73) (BI)", 5.997, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "Performance Elite 7 (0-70) (BI)", 3.652, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "Performance Elite 7 (71-75) (BI)", 3.36, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "Performance Elite 7 (76-80) (BI)", 2.776, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "Performance Elite 7 (81+) (BI)", 2.483, 100.0],
  ["Annuity", "ATHENE ANNUITIES", "SPIA 1 (BI)", 2.097, 100.0],
  ["Annuity", "ATHENE ANNUITIES - NY", "Athene NY MaxRate 3 (0-75)", 1.231, 100.0],
  ["Annuity", "ATHENE ANNUITIES - NY", "Athene NY MaxRate 3 (76-80)", 0.884, 100.0],
  ["Annuity", "ATHENE ANNUITIES - NY", "Athene NY MaxRate 3 (81+)", 0.473, 100.0],
  ["Annuity", "ATHENE ANNUITIES - NY", "Athene NY MaxRate 5 (0-75)", 1.673, 100.0],
  ["Annuity", "ATHENE ANNUITIES - NY", "Athene NY MaxRate 5 (76-80)", 1.496, 100.0],
  ["Annuity", "ATHENE ANNUITIES - NY", "Athene NY MaxRate 5 (81+)", 0.96, 100.0],
  ["Annuity", "ATHENE ANNUITIES - NY", "Athene NY MaxRate 7 (0-75)", 1.989, 100.0],
  ["Annuity", "ATHENE ANNUITIES - NY", "Athene NY MaxRate 7 (76-80)", 1.806, 100.0],
  ["Annuity", "ATHENE ANNUITIES - NY", "Athene NY MaxRate 7 (81+)", 1.117, 100.0],
  ["Annuity", "ATHENE ANNUITIES (ANNEXUS)", "Athene BCA 10 - 2.0 (0-70)", 5.269, 100.0],
  ["Annuity", "ATHENE ANNUITIES (ANNEXUS)", "Athene BCA 12 - 2.0 (0-70)", 5.579, 100.0],
  ["Annuity", "ATHENE ANNUITIES (ANNEXUS)", "Athene BCA 6 - 2.0 (0-70)", 4.028, 100.0],
  ["Annuity", "ATHENE ANNUITIES (ANNEXUS)", "Athene BCA 8 - 2.0 (0-70)", 4.648, 100.0],
  ["Annuity", "ATHENE ANNUITIES (ANNEXUS)", "Athene Velocity (0-70)", 5.578, 100.0],
  ["Alternative Investments", "CALCHOICE", "Cal-Choice - Land Banking", 6.66, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "American Pathway Deferred - Life Payout", 3.156, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "American Pathway Deferred - Period #1", 1.894, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "American Pathway Deferred - Period #2", 2.525, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "American Pathway Deferred - Period #3", 3.156, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "American Pathway Fixed 5 (18-85)", 1.894, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "American Pathway Fixed 5 (86-90)", 0.947, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "American Pathway Fixed 7 (18-85)", 2.21, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "American Pathway Fixed 7 (86-90)", 1.105, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "American Pathway Immediate - Life Payout", 2.525, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "American Pathway Immediate - Period #1", 1.263, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "American Pathway Immediate - Period #2", 1.894, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "American Pathway Immediate - Period #3", 2.525, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "American Pathway Vision 10 Year (18-75)", 2.21, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "American Pathway Vision 10 Year (76-85)", 1.105, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "American Pathway Vision 4 Year (18-75)", 1.578, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "American Pathway Vision 4 Year (76-85)", 0.789, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "American Pathway Vision 5 Year (18-75)", 1.894, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "American Pathway Vision 5 Year (76-85)", 0.947, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "American Pathway Vision 6 Year (18-75)", 1.894, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "American Pathway Vision 6 Year (76-85)", 0.947, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "American Pathway Vision 7 Year (18-75)", 2.21, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "American Pathway Vision 7 Year (76-85)", 1.105, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "Assured Edge Income (Option 1)", 3.63, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "Assured Edge Income (Option 2)", 2.841, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "Assured Edge Income (Option 3)", 2.052, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "Assured Edge Income (Option 4)", 1.42, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "Power 10 Protector Option 1 (18-75)", 6.313, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "Power 10 Protector Option 2 (18-75)", 4.577, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "Power 10 Protector Option 3 (18-75)", 3.156, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "Power 10 Protector Plus Option 1 (50-75)", 6.313, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "Power 10 Protector Plus Option 2 (50-75)", 4.577, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "Power 10 Protector Plus Option 3 (50-75)", 3.156, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "Power 5 Protector Plus Option 1 (18-80)", 3.156, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "Power 5 Protector Plus Option 2 (18-80)", 1.894, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "Power 5 Protector Plus Option 9 (81-85)", 1.578, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "Power 7 Protector Option 1 (18-80)", 4.261, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "Power 7 Protector Option 2 (18-80)", 2.683, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "Power 7 Protector Option 9 (81-85)", 2.841, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "Power 7 Protector Plus Option 1 (50-80)", 4.261, 100.0],
  ["Annuity", "COREBRIDGE ANNUITIES", "Power 7 Protector Plus Option 2 (50-80)", 2.683, 100.0],
  ["Life Insurance", "COREBRIDGE LIFE", "American Elite Whole Life", 61.82, 100.0],
  ["Life Insurance", "COREBRIDGE LIFE", "Flex Term (10yr)", 68.129, 100.0],
  ["Life Insurance", "COREBRIDGE LIFE", "Flex Term (20-35yr)", 90.0, 100.0],
  ["Life Insurance", "COREBRIDGE LIFE", "Guarantee Plus GUL II", 83.916, 100.0],
  ["Life Insurance", "COREBRIDGE LIFE", "ImperIUL Plus", 100.0, 100.0],
  ["Life Insurance", "COREBRIDGE LIFE", "Max Accumulator+ IUL", 96.209, 100.0],
  ["Life Insurance", "COREBRIDGE LIFE", "Value + Protector IUL", 91.292, 100.0],
  ["Life Insurance", "COREBRIDGE LIFE / USL (NY)", "Max Accumulator + IUL - NY", 62.499, 100.0],
  ["Life Insurance", "COREBRIDGE LIFE / USL (NY)", "Select-a-Term 10 Yrs", 57.448, 100.0],
  ["Life Insurance", "COREBRIDGE LIFE / USL (NY)", "Select-a-Term 15-19 Yrs", 57.448, 100.0],
  ["Life Insurance", "COREBRIDGE LIFE / USL (NY)", "Select-a-Term 20-30 & 35 (NY)", 62.499, 100.0],
  ["Life Insurance", "COREBRIDGE LIFE / USL (NY)", "Value + Protector III USL - NY", 62.499, 100.0],
  ["Life Insurance", "EQUITABLE", "Brightlife Grow IUL", 68.18, 100.0],
  ["Life Insurance", "EQUITABLE", "Brightlife Protect", 72.599, 100.0],
  ["Life Insurance", "EQUITABLE", "Renewable Term", 56.817, 100.0],
  ["Life Insurance", "EQUITABLE", "Term 10", 53.661, 100.0],
  ["Life Insurance", "EQUITABLE", "Term 15", 56.817, 100.0],
  ["Life Insurance", "EQUITABLE", "Term 20", 66.286, 0.0],
  ["Life Insurance", "ETHOS", "Ethos/Ameritas - Index Universal Life", 95.958, 100.0],
  ["Life Insurance", "ETHOS", "Ethos/Ameritas - Term Life - Choice", 94.695, 100.0],
  ["Life Insurance", "ETHOS", "Ethos/Banner Life - Simplified Issue Whole Life (18-59 and Over 80)", 56.817, 100.0],
  ["Life Insurance", "ETHOS", "Ethos/LGA/Banner Life - Term Life -  Prime", 94.695, 100.0],
  ["Life Insurance", "ETHOS", "Ethos/North American - Accumulation IUL", 98.07, 100.0],
  ["Life Insurance", "ETHOS", "Ethos/TruStage - Advantage Whole Life (18-59 and Over 80)", 56.817, 100.0],
  ["Life Insurance", "ETHOS", "Ethos/TruStage - Guaranteed Acceptance Whole Life", 37.878, 100.0],
  ["Life Insurance", "ETHOS", "Ethos/TruStage - Simplified Issue Term Life", 53.661, 100.0],
  ["Life Insurance", "ETHOS", "Ethos/TruStage - Term Life", 94.695, 100.0],
  ["Life Insurance", "ETHOS", "Ethos/TruStage Advantage Whole Life (60-80)", 94.695, 100.0],
  ["Annuity", "F&G ANNUITIES", "Accelerator Plus 10 (0-75) (BI)", 5.653, 100.0],
  ["Annuity", "F&G ANNUITIES", "Accelerator Plus 10 (76-80) (BI)", 4.314, 100.0],
  ["Annuity", "F&G ANNUITIES", "Accelerator Plus 10 (81-85) (BI)", 2.886, 100.0],
  ["Annuity", "F&G ANNUITIES", "Accelerator Plus 14 (0-75) (BI)", 6.09, 100.0],
  ["Annuity", "F&G ANNUITIES", "Accelerator Plus 14 (76-80) (BI)", 4.785, 100.0],
  ["Annuity", "F&G ANNUITIES", "Accelerator Plus 14 (81-85) (BI)", 3.103, 100.0],
  ["Annuity", "F&G ANNUITIES", "Accumulator Plus 10 (0-75) (BI)", 5.05, 100.0],
  ["Annuity", "F&G ANNUITIES", "Accumulator Plus 10 (76-80) (BI)", 3.647, 100.0],
  ["Annuity", "F&G ANNUITIES", "Accumulator Plus 10 (81-85) (BI)", 2.665, 100.0],
  ["Annuity", "F&G ANNUITIES", "Accumulator Plus 7 (0-75) (BI)", 3.788, 100.0],
  ["Annuity", "F&G ANNUITIES", "Accumulator Plus 7 (76-80) (BI)", 3.112, 100.0],
  ["Annuity", "F&G ANNUITIES", "Accumulator Plus 7 (81-85) (BI)", 2.3, 100.0],
  ["Annuity", "F&G ANNUITIES", "Dynamic Accumulator (BI)", 4.48, 100.0],
  ["Annuity", "F&G ANNUITIES", "Flex Accumulator (0-75) (BI)", 5.05, 100.0],
  ["Annuity", "F&G ANNUITIES", "Flex Accumulator (76-80) (BI)", 3.647, 100.0],
  ["Annuity", "F&G ANNUITIES", "Flex Accumulator (81-85) (BI)", 2.665, 100.0],
  ["Annuity", "F&G ANNUITIES", "Guarantee Platinum 3 (0-79) (BI)", 1.184, 100.0],
  ["Annuity", "F&G ANNUITIES", "Guarantee Platinum 3 (80-90) (BI)", 0.592, 100.0],
  ["Annuity", "F&G ANNUITIES", "Guarantee Platinum 5 (0-79) (BI)", 1.499, 100.0],
  ["Annuity", "F&G ANNUITIES", "Guarantee Platinum 5 (80-90) (BI)", 0.745, 100.0],
  ["Annuity", "F&G ANNUITIES", "Guarantee Platinum 7 (0-79) (BI)", 1.657, 100.0],
  ["Annuity", "F&G ANNUITIES", "Guarantee Platinum 7 (80-90) (BI)", 0.829, 100.0],
  ["Annuity", "F&G ANNUITIES", "Immediate Income (0-89) (BI)", 1.499, 100.0],
  ["Annuity", "F&G ANNUITIES", "Immediate Income with Life (0-89) (BI)", 1.499, 100.0],
  ["Annuity", "F&G ANNUITIES", "Performance Pro (0-75) (BI)", 5.088, 100.0],
  ["Annuity", "F&G ANNUITIES", "Performance Pro (76-80) (BI)", 3.816, 100.0],
  ["Annuity", "F&G ANNUITIES", "Power Accumulator 10 (0-75) (BI)", 5.05, 100.0],
  ["Annuity", "F&G ANNUITIES", "Power Accumulator 10 (76-80) (BI)", 3.647, 100.0],
  ["Annuity", "F&G ANNUITIES", "Power Accumulator 10 (81-85) (BI)", 2.665, 100.0],
  ["Annuity", "F&G ANNUITIES", "Power Accumulator 7 (0-75) (BI)", 3.788, 100.0],
  ["Annuity", "F&G ANNUITIES", "Power Accumulator 7 (76-80) (BI)", 3.112, 100.0],
  ["Annuity", "F&G ANNUITIES", "Power Accumulator 7 (81-85) (BI)", 2.3, 100.0],
  ["Annuity", "F&G ANNUITIES", "Prosperity Elite 10 (0-70) (BI)", 5.088, 100.0],
  ["Annuity", "F&G ANNUITIES", "Prosperity Elite 10 (71-75) (BI)", 3.816, 100.0],
  ["Annuity", "F&G ANNUITIES", "Prosperity Elite 10 (76-85) (BI)", 2.459, 100.0],
  ["Annuity", "F&G ANNUITIES", "Prosperity Elite 14 (0-70) (BI)", 5.997, 100.0],
  ["Annuity", "F&G ANNUITIES", "Prosperity Elite 14 (71-75) (BI)", 4.577, 100.0],
  ["Annuity", "F&G ANNUITIES", "Prosperity Elite 14 (76-85) (BI)", 2.904, 100.0],
  ["Annuity", "F&G ANNUITIES", "Prosperity Elite 7 (0-70) (BI)", 4.735, 100.0],
  ["Annuity", "F&G ANNUITIES", "Prosperity Elite 7 (71-75) (BI)", 3.314, 100.0],
  ["Annuity", "F&G ANNUITIES", "Prosperity Elite 7 (76-85) (BI)", 2.367, 100.0],
  ["Annuity", "F&G ANNUITIES", "Safe Income Advantage (0-75) (BI)", 5.049, 100.0],
  ["Annuity", "F&G ANNUITIES", "Safe Income Advantage (76-80) (BI)", 3.564, 100.0],
  ["Annuity", "F&G ANNUITIES - NY", "Index-Choice 10 (0-75)", 2.909, 100.0],
  ["Annuity", "F&G ANNUITIES - NY", "Index-Choice 10 (76-85)", 1.455, 100.0],
  ["Life Insurance", "F&G LIFE", "Everlast IUL (0-17)", 75.996, 100.0],
  ["Life Insurance", "F&G LIFE", "Everlast IUL (18-80)", 94.995, 100.0],
  ["Life Insurance", "F&G LIFE", "ExecuDex IUL (18-60)", 95.0, 100.0],
  ["Life Insurance", "F&G LIFE", "Pathsetter IUL (0-17)", 73.548, 100.0],
  ["Life Insurance", "F&G LIFE", "Pathsetter IUL (18-80)", 95.0, 100.0],
  ["Life Insurance", "LINCOLN FINANCIAL", "Conversion UL", 75.756, 100.0],
  ["Life Insurance", "LINCOLN FINANCIAL", "LifeElements - 10 Year", 77.65, 100.0],
  ["Life Insurance", "LINCOLN FINANCIAL", "LifeElements - 15 Year", 84.594, 100.0],
  ["Life Insurance", "LINCOLN FINANCIAL", "LifeElements - 20 & 30 Year", 92.17, 100.0],
  ["Life Insurance", "LINCOLN FINANCIAL", "MoneyGuard Fixed Advantage", 6.944, 100.0],
  ["Life Insurance", "LINCOLN FINANCIAL", "TermAccel - 10 Year", 77.65, 100.0],
  ["Life Insurance", "LINCOLN FINANCIAL", "TermAccel - 15 Year", 84.594, 100.0],
  ["Life Insurance", "LINCOLN FINANCIAL", "TermAccel - 20 & 30 Year", 92.17, 100.0],
  ["Life Insurance", "LINCOLN FINANCIAL", "WealthAccelerate IUL", 91.539, 100.0],
  ["Life Insurance", "LINCOLN FINANCIAL", "WealthAccum 2 IUL", 75.756, 100.0],
  ["Life Insurance", "LINCOLN FINANCIAL", "WealthAccum 2 IUL - Enhanced Value Rider - Levelized", 11.363, 100.0],
  ["Life Insurance", "LINCOLN FINANCIAL", "WealthAccum 2 IUL - Enhanced Value Rider - Semi Heaped", 25.252, 100.0],
  ["Life Insurance", "LINCOLN FINANCIAL", "WealthAccum 2 IUL - Surrender Value Enhanced Endorsement - Levelized", 25.883, 100.0],
  ["Life Insurance", "LINCOLN FINANCIAL", "WealthAccum 2 IUL - Surrender Value Enhanced Endorsement - Semi Heaped", 33.459, 100.0],
  ["Life Insurance", "LINCOLN FINANCIAL", "WealthBuilder ECV IUL", 59.973, 100.0],
  ["Life Insurance", "LINCOLN FINANCIAL", "WealthBuilder IUL", 83.332, 100.0],
  ["Life Insurance", "LINCOLN FINANCIAL", "WealthPreserve 2 IUL", 75.756, 100.0],
  ["Life Insurance", "LINCOLN FINANCIAL", "WealthPreserve 2 SIUL", 75.756, 100.0],
  ["Life Insurance", "LINCOLN FINANCIAL", "WealthProtector IUL", 83.332, 100.0],
  ["Annuity", "LINCOLN FINANCIAL ANNUITIES", "Deferred Income Solutions Annuity", 2.525, 100.0],
  ["Annuity", "LINCOLN FINANCIAL ANNUITIES", "Insured Income Immediate Annuity", 1.894, 100.0],
  ["Annuity", "LINCOLN FINANCIAL ANNUITIES", "MyGuarantee Plus - 5 Year (0-75)", 1.263, 100.0],
  ["Annuity", "LINCOLN FINANCIAL ANNUITIES", "MyGuarantee Plus - 5 Year (76-80)", 0.821, 100.0],
  ["Annuity", "LINCOLN FINANCIAL ANNUITIES", "MyGuarantee Plus - 5 Year (81-85)", 0.473, 100.0],
  ["Annuity", "LINCOLN FINANCIAL ANNUITIES", "MyGuarantee Plus - 7 & 10 Year (0-75)", 1.578, 100.0],
  ["Annuity", "LINCOLN FINANCIAL ANNUITIES", "MyGuarantee Plus - 7 & 10 Year (76-80)", 1.01, 100.0],
  ["Annuity", "LINCOLN FINANCIAL ANNUITIES", "MyGuarantee Plus - 7 & 10 Year (81-85)", 0.631, 100.0],
  ["Annuity", "LINCOLN FINANCIAL ANNUITIES", "OptiBlend 10 (0-74)", 4.419, 100.0],
  ["Annuity", "LINCOLN FINANCIAL ANNUITIES", "OptiBlend 10 (75-79)", 2.525, 100.0],
  ["Annuity", "LINCOLN FINANCIAL ANNUITIES", "OptiBlend 10 (80)", 1.105, 100.0],
  ["Annuity", "LINCOLN FINANCIAL ANNUITIES", "OptiBlend 5 (0-74)", 2.367, 100.0],
  ["Annuity", "LINCOLN FINANCIAL ANNUITIES", "OptiBlend 5 (75-79)", 1.515, 100.0],
  ["Annuity", "LINCOLN FINANCIAL ANNUITIES", "OptiBlend 5 (80-84)", 0.884, 100.0],
  ["Annuity", "LINCOLN FINANCIAL ANNUITIES", "OptiBlend 5 (85)", 0.442, 100.0],
  ["Annuity", "LINCOLN FINANCIAL ANNUITIES", "OptiBlend 7 (0-74)", 3.156, 100.0],
  ["Annuity", "LINCOLN FINANCIAL ANNUITIES", "OptiBlend 7 (75-79)", 1.894, 100.0],
  ["Annuity", "LINCOLN FINANCIAL ANNUITIES", "OptiBlend 7 (80-84)", 1.105, 100.0],
  ["Annuity", "LINCOLN FINANCIAL ANNUITIES", "OptiBlend 7 (85)", 0.473, 100.0],
  ["Life Insurance", "MINNESOTA LIFE", "Accumulator UL", 72.599, 100.0],
  ["Life Insurance", "MINNESOTA LIFE", "Balanced Growth Accumulator IUL (Annexus)", 66.286, 100.0],
  ["Life Insurance", "MINNESOTA LIFE", "Balanced Growth Advantage IUL", 72.599, 100.0],
  ["Life Insurance", "MINNESOTA LIFE", "Eclipse IUL", 72.599, 100.0],
  ["Life Insurance", "MINNESOTA LIFE", "Eclipse Survivor IUL", 72.599, 100.0],
  ["Life Insurance", "MINNESOTA LIFE", "Eclipse Survivor Pro IUL", 72.599, 100.0],
  ["Life Insurance", "MINNESOTA LIFE", "Elite Select Term - 15yr", 69.443, 100.0],
  ["Life Insurance", "MINNESOTA LIFE", "Elite Select Term - 20yr", 75.756, 100.0],
  ["Life Insurance", "MINNESOTA LIFE", "Elite Select Term - 30yr", 75.756, 100.0],
  ["Life Insurance", "MINNESOTA LIFE", "Elite Select Term - 5, 10yr", 63.13, 100.0],
  ["Life Insurance", "MINNESOTA LIFE", "Legacy Protector IUL", 72.599, 100.0],
  ["Life Insurance", "MINNESOTA LIFE", "Omega Builder IUL", 72.599, 100.0],
  ["Life Insurance", "MINNESOTA LIFE", "Secure Accumulator Whole Life", 72.599, 100.0],
  ["Life Insurance", "MINNESOTA LIFE", "Secure Whole Life", 72.599, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "AccumUL Answers", 81.25, 100.0],
  ["Annuity", "MUTUAL OF OMAHA", "Bonus Flexible Annuity - 0-80", 3.125, 100.0],
  ["Annuity", "MUTUAL OF OMAHA", "Bonus Flexible Annuity - 81+", 1.875, 100.0],
  ["Annuity", "MUTUAL OF OMAHA", "Deferred Income Protector", 3.125, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Disability - (CV) Riders - Non-Cancellable & Guaranteed (ROP)", 2.48, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Disability - D90 Guaranteed Renewable", 49.6, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Disability - D90 Guaranteed Renewable (AG), (ML), (CE) Discounts", 46.5, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Disability - D90 Non-Cancellable", 52.7, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Disability - D90 Non-Cancellable - (AG), (ML), (CE) Discounts", 49.6, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Hospital Indemnity Plan", 50.0, 100.0],
  ["Annuity", "MUTUAL OF OMAHA", "Income Access SPIA - 0-75", 3.75, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Income Advantage IUL", 90.625, 100.0],
  ["Annuity", "MUTUAL OF OMAHA", "Income Annuity with Premium Return - 0-75", 3.125, 100.0],
  ["Annuity", "MUTUAL OF OMAHA", "Income Annuity with Premium Return - 76-80", 2.5, 100.0],
  ["Annuity", "MUTUAL OF OMAHA", "Income Annuity with Premium Return - 81+", 1.875, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Life Protection Advantage IUL", 90.625, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Long Term Care - LTC (0-69)", 39.063, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Long Term Care - LTC (70-74)", 26.563, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Long Term Care - LTC (75-79)", 23.438, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Term Life Answers (10 yr)", 70.0, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Term Life Answers (15 yr)", 78.75, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Term Life Answers (20-30 yr)", 87.5, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Ultra Advantage FIA 10yr - 0-75", 5.938, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Ultra Advantage FIA 10yr - 76+", 4.531, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Ultra Advantage FIA 3yr - 0-75", 2.188, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Ultra Advantage FIA 3yr - 76-80", 1.563, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Ultra Advantage FIA 3yr - 81+", 1.25, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Ultra Advantage FIA 4yr - 0-75", 2.813, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Ultra Advantage FIA 4yr - 76-80", 1.875, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Ultra Advantage FIA 5yr - 0-75", 3.438, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Ultra Advantage FIA 5yr - 76-80", 2.813, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Ultra Advantage FIA 5yr - 81+", 2.344, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Ultra Advantage FIA 7yr - 0-75", 4.375, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Ultra Advantage FIA 7yr - 76-80", 3.594, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Ultra Advantage FIA 7yr - 81+", 2.813, 100.0],
  ["Annuity", "MUTUAL OF OMAHA", "Ultra Income SPIA - Guaranteed Period 10-15yr", 2.344, 100.0],
  ["Annuity", "MUTUAL OF OMAHA", "Ultra Income SPIA - Guaranteed Period 15yr+", 2.5, 100.0],
  ["Annuity", "MUTUAL OF OMAHA", "Ultra Income SPIA - Guaranteed Period 5-10yr", 2.188, 100.0],
  ["Annuity", "MUTUAL OF OMAHA", "Ultra Income SPIA <$1m - Life Contingent - 0-75", 2.5, 100.0],
  ["Annuity", "MUTUAL OF OMAHA", "Ultra Income SPIA <$1m - Life Contingent - 75-80", 2.344, 100.0],
  ["Annuity", "MUTUAL OF OMAHA", "Ultra Income SPIA <$1m - Life Contingent - 81+", 2.188, 100.0],
  ["Annuity", "MUTUAL OF OMAHA", "Ultra Income SPIA >$1m - Life Contingent - 0-75", 2.188, 100.0],
  ["Annuity", "MUTUAL OF OMAHA", "Ultra Income SPIA >$1m - Life Contingent - 75-80", 2.031, 100.0],
  ["Annuity", "MUTUAL OF OMAHA", "Ultra Income SPIA >$1m - Life Contingent - 81+", 1.875, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Ultra Premier 5 & 7 - 0-75", 2.344, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Ultra Premier 5 & 7 - 76-80", 1.719, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Ultra Premier 5 & 7 - 81+", 1.094, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Ultra Secure Plus 5 & 7 - 0-75", 3.125, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Ultra Secure Plus 5 & 7 - 76-80", 2.5, 100.0],
  ["Life Insurance", "MUTUAL OF OMAHA", "Ultra Secure Plus 5 & 7 - 81+", 1.875, 100.0],
  ["Annuity", "NATIONWIDE ANNUITIES (ANNEXUS)", "CareMatters Annuity (40-75)", 7.13, 100.0],
  ["Annuity", "NATIONWIDE ANNUITIES (ANNEXUS)", "CareMatters Annuity (76-80)", 4.65, 100.0],
  ["Annuity", "NATIONWIDE ANNUITIES (ANNEXUS)", "New Heights 10 (0-70)", 6.126, 100.0],
  ["Annuity", "NATIONWIDE ANNUITIES (ANNEXUS)", "New Heights 12 (0-70)", 6.857, 100.0],
  ["Annuity", "NATIONWIDE ANNUITIES (ANNEXUS)", "New Heights 8 (0-70)", 5.196, 100.0],
  ["Annuity", "NATIONWIDE ANNUITIES (ANNEXUS)", "New Heights 9 (0-70)", 6.126, 100.0],
  ["Annuity", "NATIONWIDE ANNUITIES (ANNEXUS)", "New Heights 9 (76-80)", 3.646, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "Accumulator III IUL (No Trail)", 85.423, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "Accumulator III IUL (With Trail)", 78.852, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "Care Matters II - 10 Yr Pay Option", 50.575, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "Care Matters II - 20 Yr Pay Option", 62.475, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "Care Matters II - 5 Yr Pay Option", 34.51, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "Care Matters II - Pay to 100", 71.4, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "Care Matters II - Pay to 65", 62.475, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "Care Matters II - Single Pay & Lump Sum", 6.545, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "Care Matters Together - 10 Yr Pay", 50.575, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "Care Matters Together - 20 Yr Pay", 62.475, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "Care Matters Together - 5 Yr Pay", 34.51, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "Care Matters Together - Pay to 100", 71.4, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "Care Matters Together - Single Pay", 6.545, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "Care Matters Universal Life (NY)", 4.463, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "Heritage Single Premium Whole Life", 4.76, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "Heritage Single Premium Whole Life (NY)", 4.76, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "New Heights IUL (No Trail)", 85.428, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "New Heights IUL (With Trail)", 78.852, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "YourLife 10 Yr Guaranteed Level Term (NY)", 59.4, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "YourLife 15 Yr Guaranteed Level Term (NY)", 59.4, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "YourLife 20 Yr Guaranteed Level Term (NY)", 59.4, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "YourLife 30 Yr Guaranteed Level Term (NY)", 57.0, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "YourLife Guaranteed Level Term (10yr)", 68.425, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "YourLife Guaranteed Level Term (15yr)", 71.4, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "YourLife Guaranteed Level Term (20-30yr)", 77.35, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "YourLife IUL Accumulator II", 85.423, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "YourLife IUL Accumulator- (NY)", 59.4, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "YourLife IUL Protector", 85.423, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "YourLife IUL Protector- (NY)", 59.4, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "YourLife No Lapse Guarantee UL", 78.926, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "YourLife No Lapse Guarantee UL (NY)", 59.4, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "YourLife Survivorship IUL", 85.423, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "YourLife WL Series", 78.926, 100.0],
  ["Life Insurance", "NATIONWIDE LIFE", "YourLife Whole Life 100 (NY)", 27.32, 100.0],
  ["Alternative Investments", "NETLAW", "NetLaw Essential Estate Plan", 78.894, 100.0],
  ["Alternative Investments", "NETLAW", "NetLaw Premium Probate Avoidance", 83.34, 100.0],
  ["Alternative Investments", "NETLAW", "NetLaw Premium Probate Avoidance - Bulk", 83.337, 100.0],
  ["Alternative Investments", "NETLAW", "NetLaw Special Needs Trust", 78.913, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES", "Benefit Solutions (10 year) (0-75)", 5.382, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES", "Benefit Solutions (10 year) (76-79)", 4.037, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES", "Charter Plus (10 &14 Year) (0-75)", 5.681, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES", "Charter Plus (10 &14 Year) (76-79)", 4.264, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES", "Control X (10 Year) (0-75)", 5.68, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES", "Control X (10 Year) (76-79)", 4.263, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES", "Income (All Other Options)", 2.525, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES", "Income (All Other Options) (76-79)", 1.894, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES", "Income (All Other Options) (80-85)", 1.263, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES", "Income (Period Certain 5-9 Years)", 1.263, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES", "Income (Period Certain 5-9 Years) (76-79)", 0.947, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES", "Income (Period Certain 5-9 Years) (80-85)", 0.631, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES", "Income Choice (10 year) (0-75)", 4.419, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES", "Income Choice (10 year) (76-79)", 4.261, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES", "Income Choice (10 year) (80-85)", 2.841, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES", "Income Pay Pro (10 year) (0-75)", 5.68, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES", "Income Pay Pro (10 year) (76-79)", 4.263, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES", "NAC Guarantee Plus (3 Year)", 1.578, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES", "NAC Guarantee Plus (5 Year)", 1.894, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES", "NAC Guarantee Plus (7 Year)", 2.21, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES", "Performance Choice (8 Year) - (0-75)", 3.95, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES", "Performance Choice (8 Year) - (76-79)", 2.961, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES", "Performance Choice (8 Year) - (80+)", 1.978, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES", "PrimePath Pro 10 & 12 - (40-75)", 5.68, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES", "PrimePath Pro 10 & 12 - (76-79)", 4.263, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES", "VersaChoice (10 Year) (0-75)", 5.68, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES", "VersaChoice (10 Year) (76-79)", 4.263, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES (ANNEXUS)", "Secure Horizon (0-70)", 6.015, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES (ANNEXUS)", "Secure Horizon (71-75)", 5.483, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES (ANNEXUS)", "Secure Horizon (76+)", 4.263, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES (ANNEXUS)", "Secure Horizon Accelerator (0-70)", 6.015, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES (ANNEXUS)", "Secure Horizon Accelerator (71-75)", 5.483, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES (ANNEXUS)", "Secure Horizon Accelerator (76+)", 4.263, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES (ANNEXUS)", "Secure Horizon Choice 5 (0-70)", 4.634, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES (ANNEXUS)", "Secure Horizon Choice 5 (71-75)", 3.982, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES (ANNEXUS)", "Secure Horizon Choice 5 (76-79)", 2.816, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES (ANNEXUS)", "Secure Horizon Choice 5 (80+)", 2.308, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES (ANNEXUS)", "Secure Horizon Choice 7 (0-70)", 5.381, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES (ANNEXUS)", "Secure Horizon Choice 7 (71-75)", 4.622, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES (ANNEXUS)", "Secure Horizon Choice 7 (76-79)", 3.605, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES (ANNEXUS)", "Secure Horizon Plus (0-70)", 6.015, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES (ANNEXUS)", "Secure Horizon Plus (71-75)", 5.483, 100.0],
  ["Annuity", "NORTH AMERICAN ANNUITIES (ANNEXUS)", "Secure Horizon Plus (76+)", 4.263, 100.0],
  ["Life Insurance", "NORTH AMERICAN LIFE", "ADDvantage Term 10yr", 69.443, 100.0],
  ["Life Insurance", "NORTH AMERICAN LIFE", "ADDvantage Term 15yr", 72.599, 100.0],
  ["Life Insurance", "NORTH AMERICAN LIFE", "ADDvantage Term 20yr", 90.002, 100.0],
  ["Life Insurance", "NORTH AMERICAN LIFE", "ADDvantage Term 30yr", 90.002, 100.0],
  ["Life Insurance", "NORTH AMERICAN LIFE", "Builder Plus 3 IUL", 100.001, 100.0],
  ["Life Insurance", "NORTH AMERICAN LIFE", "Builder Plus 4 IUL", 100.001, 100.0],
  ["Life Insurance", "NORTH AMERICAN LIFE", "Classic Term 10yr", 56.817, 100.0],
  ["Life Insurance", "NORTH AMERICAN LIFE", "Classic Term 15yr", 63.13, 100.0],
  ["Life Insurance", "NORTH AMERICAN LIFE", "Custom Guarantee UL", 69.443, 100.0],
  ["Life Insurance", "NORTH AMERICAN LIFE", "Protection Builder IUL", 85.226, 100.0],
  ["Life Insurance", "NORTH AMERICAN LIFE", "Secure Horizon LifeStage IUL", 100.001, 100.0],
  ["Life Insurance", "NORTH AMERICAN LIFE", "SmartBuilder IUL", 78.913, 100.0],
  ["Life Insurance", "SENIOR LIFE", "Easy Issue Whole Life (Other)", 27.777, 100.0],
  ["Life Insurance", "SENIOR LIFE", "Easy Issue Whole Life (VAP)", 40.403, 100.0],
  ["Life Insurance", "SENIOR LIFE", "Graded Easy Whole Life - Missouri (Other)", 59.973, 100.0],
  ["Life Insurance", "SENIOR LIFE", "Graded Easy Whole Life - Missouri (VAT)", 72.599, 100.0],
  ["Life Insurance", "SENIOR LIFE", "Graded Modified Whole Life - Missouri (Other)", 59.973, 100.0],
  ["Life Insurance", "SENIOR LIFE", "Graded Modified Whole Life - Missouri (VAT)", 72.599, 100.0],
  ["Life Insurance", "SENIOR LIFE", "Guaranteed Issue (Other)", 47.347, 100.0],
  ["Life Insurance", "SENIOR LIFE", "Guaranteed Issue (VAP)", 59.973, 100.0],
  ["Life Insurance", "SENIOR LIFE", "Modified Whole Life (Other)", 63.13, 100.0],
  ["Life Insurance", "SENIOR LIFE", "Modified Whole Life (VAP)", 75.756, 100.0],
  ["Life Insurance", "SENIOR LIFE", "Substandard - MN, MA (Other)", 34.722, 0.0],
  ["Life Insurance", "SENIOR LIFE", "Substandard - MN, MA (VAP)", 47.347, 0.0],
  ["Life Insurance", "SENIOR LIFE", "Term 20 (Other)", 75.756, 100.0],
  ["Life Insurance", "SENIOR LIFE", "Term 20 (VAP)", 88.382, 100.0],
  ["Life Insurance", "SENIOR LIFE", "Term Return of Premium (Other)", 88.382, 100.0],
  ["Life Insurance", "SENIOR LIFE", "Term Return of Premium (VAP)", 41.034, 100.0],
  ["Life Insurance", "SENIOR LIFE", "Whole Life - 20 Pay (Other)", 49.241, 100.0],
  ["Life Insurance", "SENIOR LIFE", "Whole Life - 20 Pay (VAP)", 61.867, 100.0],
  ["Life Insurance", "SENIOR LIFE", "Whole Life - Joint (Other)", 69.443, 100.0],
  ["Life Insurance", "SENIOR LIFE", "Whole Life - Joint (VAP)", 82.069, 100.0],
  ["Life Insurance", "SENIOR LIFE", "Whole Life - Preferred (Other)", 75.756, 100.0],
  ["Life Insurance", "SENIOR LIFE", "Whole Life - Preferred (VAP)", 88.382, 100.0],
  ["Life Insurance", "SENIOR LIFE", "Whole Life - Standard (Other)", 66.286, 100.0],
  ["Life Insurance", "SENIOR LIFE", "Whole Life - Standard (VAP)", 78.913, 100.0],
  ["Life Insurance", "SENIOR LIFE", "Whole Life - Super Preferred (Other)", 75.756, 100.0],
  ["Life Insurance", "SENIOR LIFE", "Whole Life - Super Preferred (VAP)", 88.382, 100.0],
  ["Life Insurance", "SENIOR LIFE", "Whole Life - Ultimate Preferred (Other)", 26.83, 100.0],
  ["Life Insurance", "SENIOR LIFE", "Whole Life - Ultimate Preferred (VAP)", 39.456, 100.0],
];
export const PROD_SEED: Product[] = PROD_SEED_RAW.map((r, i) => ({ id: "p" + (i + 1), category: r[0], provider: r[1], product: r[2], base: r[3], advance: r[4], country: "USA" }));

export function loadProducts(): Product[] {
  try {
    const r = localStorage.getItem(PROD_KEY);
    if (r) return JSON.parse(r);
  } catch { /* ignore */ }
  try { localStorage.setItem(PROD_KEY, JSON.stringify(PROD_SEED)); } catch { /* ignore */ }
  return PROD_SEED;
}
export function saveProducts(list: Product[]) {
  try { localStorage.setItem(PROD_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

const INC_KEY = "crm-income-v1";
export function loadIncome(): IncomeData | null {
  try {
    const r = localStorage.getItem(INC_KEY);
    if (r) return JSON.parse(r);
  } catch { /* ignore */ }
  return null;
}
export function saveIncome(inc: IncomeData) {
  try { localStorage.setItem(INC_KEY, JSON.stringify(inc)); } catch { /* ignore */ }
}

export function seedIncome(db: Db, products: Product[]): IncomeData {
  const ag = db.agents.map(a => a.name);
  const cl = db.clients;
  const pr = products;
  const d = (m: number, day: number) => {
    const x = new Date();
    x.setDate(1);
    x.setMonth(x.getMonth() - m);
    x.setDate(day);
    return x.toISOString().slice(0, 10);
  };
  const sales: Sale[] = ag.length && cl.length && pr.length
    ? ([[0, 6, 0, 0, 12000, "Pending"], [0, 2, 1, 1, 8500, "Paid"], [1, 18, 2, 2, 25000, "Paid"], [2, 9, 3, 3, 15000, "Paid"], [3, 14, 4, 4, 30000, "Paid"], [4, 3, 5, 0, 10000, "Paid"]] as [number, number, number, number, number, "Pending" | "Paid"][])
      .map((r, i) => {
        const p = pr[r[3] % pr.length];
        return { id: "s" + (i + 1), date: d(r[0], r[1]), clientId: cl[r[2] % cl.length].id, productId: p.id, productLabel: p.provider + " · " + p.product, basePct: p.base, premium: r[4], agent: ag[(i * 2 + 1) % ag.length], contractPct: 30, status: r[5] };
      })
    : [];
  const partner: PartnerIncome[] = ag.length
    ? [{ id: "x1", date: d(0, 4), agent: ag[0], partner: "Referral partner", amount: 450, note: "Shared case" }, { id: "x2", date: d(2, 20), agent: ag[0], partner: "Referral partner", amount: 300, note: "" }]
    : [];
  return { levels: [10, 5, 3], sales, partner };
}

export function download(name: string, text: string, type?: string) {
  const url = URL.createObjectURL(new Blob([text], { type: type || "text/plain" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function toCsv<T extends Record<string, any>>(rows: T[], keys: string[]) {
  const esc = (v: any) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
  return [keys.join(",")].concat(rows.map(r => keys.map(k => esc(r[k])).join(","))).join("\n");
}

export function commissionOf(p: Purchase) {
  return ((Number(p.businessValue) || 0) * (Number(p.agentPct) || 0)) / 100;
}

// Canonical commission math for a logged sale: premium × commissionable
// base % = the commissionable amount, × contract % = what the agent
// actually earns. Matches the real platform's Contract % calculator.
export function saleWriting(s: Sale) {
  const base = ((Number(s.premium) || 0) * (Number(s.basePct) || 0)) / 100;
  return { base, writing: (base * (Number(s.contractPct) || 0)) / 100 };
}
