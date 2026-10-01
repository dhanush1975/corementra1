import { AGENT_NAMES, branchOf, KINDS, NEEDS, PLANS, REGIONS, SOURCES, STAGES, today, uid } from "./data";
import type { Agent, Db } from "./types";

export type FieldDef = {
  k: string;
  l: string;
  t: "text" | "date" | "select" | "number" | "area";
  options?: string[];
  from?: keyof Db;
  fromAgents?: boolean;
  optional?: boolean;
  span2?: boolean;
};

export const ENTITY_FIELDS: Record<string, FieldDef[]> = {
  events: [
    { k: "name", l: "Event name", t: "text", span2: true },
    { k: "date", l: "Date", t: "date" },
    { k: "timeFrame", l: "Time frame", t: "text" },
    { k: "location", l: "Address / location", t: "text", span2: true },
    { k: "status", l: "Status", t: "select", options: ["Upcoming", "Completed"] },
    { k: "expense", l: "Event expense ($)", t: "number" },
    { k: "registered", l: "Registered", t: "number" },
    { k: "attended", l: "Attended", t: "number" },
  ],
  prospects: [
    { k: "name", l: "Full name", t: "text" },
    { k: "kind", l: "Is this a prospect or a client?", t: "select", options: [...KINDS] },
    { k: "agent", l: "Added under (agent)", t: "select", fromAgents: true, optional: true },
    { k: "email", l: "Email", t: "text" },
    { k: "phone", l: "Phone", t: "text" },
    { k: "eventId", l: "Event (optional)", t: "select", from: "events", optional: true },
    { k: "source", l: "How we met", t: "select", options: SOURCES },
    { k: "need", l: "Financial need", t: "select", options: NEEDS },
    { k: "stage", l: "Stage", t: "select", options: [...STAGES] },
    { k: "plan", l: "Plan / product interested in", t: "select", options: PLANS, span2: true },
    { k: "lastContact", l: "Last contact", t: "date" },
    { k: "notes", l: "Notes", t: "area", span2: true },
  ],
  followUps: [
    { k: "subject", l: "Who / what", t: "text" },
    { k: "agent", l: "Agent", t: "select", fromAgents: true },
    { k: "type", l: "Type", t: "select", options: ["Call", "Email", "Appointment", "Task"] },
    { k: "dueDate", l: "Due date", t: "date" },
    { k: "status", l: "Status", t: "select", options: ["Open", "Completed"] },
    { k: "prospectId", l: "Linked prospect", t: "select", from: "prospects", optional: true },
    { k: "note", l: "Note", t: "area", span2: true },
  ],
  clients: [
    { k: "name", l: "Full name", t: "text" },
    { k: "type", l: "Type", t: "select", options: ["Client", "Partner", "Both"] },
    { k: "email", l: "Email", t: "text" },
    { k: "phone", l: "Phone", t: "text" },
    { k: "address", l: "Address", t: "text", span2: true },
    { k: "agent", l: "Added under (their upline)", t: "select", fromAgents: true, optional: true, span2: true },
    { k: "source", l: "Referral source", t: "select", options: SOURCES },
    { k: "since", l: "Client since", t: "date" },
  ],
  purchases: [
    { k: "clientId", l: "Client / partner", t: "select", from: "clients", span2: true },
    { k: "product", l: "Product purchased", t: "text", span2: true },
    { k: "date", l: "Purchase date", t: "date" },
    { k: "businessValue", l: "Business value ($)", t: "number" },
    { k: "agentPct", l: "Agent %", t: "number" },
  ],
  feedback: [
    { k: "clientId", l: "Client", t: "select", from: "clients", span2: true },
    { k: "rating", l: "Rating (1–5)", t: "select", options: ["1", "2", "3", "4", "5"] },
    { k: "date", l: "Date", t: "date" },
    { k: "comment", l: "Comment", t: "area", span2: true },
  ],
  agents: [
    { k: "name", l: "Full name", t: "text" },
    { k: "title", l: "Title / role", t: "text" },
    { k: "uplineId", l: "Reports to", t: "select", from: "agents", optional: true, span2: true },
    { k: "region", l: "Region", t: "select", options: REGIONS },
    { k: "status", l: "Status", t: "select", options: ["Active", "Inactive"] },
    { k: "email", l: "Email", t: "text" },
    { k: "phone", l: "Phone", t: "text" },
    { k: "joined", l: "Joined", t: "date" },
  ],
};

export const ENTITY_META: Record<string, { singular: string; plural: string }> = {
  events: { singular: "event", plural: "Events" },
  prospects: { singular: "contact", plural: "Prospects" },
  followUps: { singular: "follow-up", plural: "Follow-Ups" },
  clients: { singular: "record", plural: "Clients" },
  purchases: { singular: "purchase", plural: "Commissions" },
  feedback: { singular: "response", plural: "Feedback" },
  agents: { singular: "agent", plural: "Agents" },
};

export function blankRecord(key: string): any {
  const rec: any = { id: uid() };
  (ENTITY_FIELDS[key] || []).forEach(f => {
    rec[f.k] = f.t === "date" ? today() : f.t === "select" && f.options ? f.options[0] : f.t === "number" ? 0 : "";
  });
  if (key === "prospects") { rec.stage = "NEW"; rec.plan = PLANS[0]; rec.eventId = ""; rec.kind = KINDS[0]; }
  if (key === "followUps") rec.status = "Open";
  if (key === "purchases") rec.agentPct = 10;
  if (key === "agents") { rec.region = REGIONS[0]; rec.status = "Active"; }
  return rec;
}

export function optionsFor(field: FieldDef, db: Db, agents: Agent[], record?: any): { v: string; l: string }[] {
  if (field.fromAgents) {
    const names = agents.length ? agents.map(a => a.name) : AGENT_NAMES;
    return (field.optional ? [{ v: "", l: "— none —" }] : []).concat(names.map(n => ({ v: n, l: n })));
  }
  if (field.from) {
    const list = (db[field.from] as any[]) || [];
    const base = field.optional ? [{ v: "", l: "— none —" }] : [];
    if (field.from === "agents") {
      // "Reports to" specifically: picking yourself or anyone currently in
      // your own downline would create a cycle in the org chart, which
      // branchOf/directsOf can't safely traverse — exclude them up front.
      const blocked = field.k === "uplineId" && record?.name ? new Set(branchOf(agents, record.name)) : null;
      return base.concat(
        list.filter((a: Agent) => !blocked || !blocked.has(a.name)).map((a: Agent) => ({ v: a.id, l: a.name })),
      );
    }
    return base.concat(list.map((r: any) => ({ v: r.id, l: r.name || r.subject })));
  }
  return (field.options || []).map(o => ({ v: o, l: o }));
}
