export type Stage = "NEW" | "CONTACTED" | "APPOINTMENT" | "IN PROCESS" | "CONVERTED" | "NOT INTERESTED";
export type ClientType = "Client" | "Partner" | "Both";
export type ProspectKind = "Not decided yet" | "Prospect" | "Client";

export interface EventRecord {
  id: string;
  name: string;
  date: string;
  location: string;
  timeFrame: string;
  expense: number;
  status: "Upcoming" | "Completed";
  registered: number;
  attended: number;
  completedAt?: string;
}

export interface BoothRecord {
  id: string;
  name: string;
  date: string;
  location: string;
  timeFrame: string;
  expense: number;
  status: "Upcoming" | "Completed";
  completedAt?: string;
}

// Written only by the public booth page (via the public-rsvp function);
// the dashboard reads and deletes these. `analysis` is the JSON of
// src/app/booth/fna.ts's Analysis.
export interface BoothEntry {
  id: string;
  boothId: string;
  prospectId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  analysis?: string | null;
  savedAt?: string | null;
  createdAt?: string;
}

export interface Prospect {
  id: string;
  name: string;
  email: string;
  phone: string;
  eventId: string;
  source: string;
  need: string;
  agent: string;
  stage: Stage;
  plan: string;
  lastContact: string;
  notes: string;
  kind: ProspectKind;
  completedAt?: string;
  birthday?: string;
  // Client details. Set clientType ("Client" / "Partner" / "Both") and the
  // person shows on the Clients board; "" means not a client (yet).
  clientType?: ClientType | "";
  since?: string;
  address?: string;
  // Events registered for after the first one (eventId). See eventsOf().
  eventIds?: string[];
}

// A row of the old, separate Clients table. Clients are now people
// (Prospect with clientType); these are only read once, to move them over
// (see absorbClients in people.ts), and in old JSON backups.
export interface LegacyClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: ClientType;
  agent: string;
  source: string;
  since: string;
  prospectId?: string;
  birthday?: string;
}

export interface Purchase {
  id: string;
  clientId: string;
  product: string;
  date: string;
  businessValue: number;
  agentPct: number;
}

export interface FollowUp {
  id: string;
  prospectId: string;
  subject: string;
  type: "Call" | "Email" | "Appointment" | "Task";
  dueDate: string;
  dueTime?: string;
  status: "Open" | "Completed";
  note: string;
  agent: string;
  completedAt?: string;
  contactCount?: number;
  lastContactedAt?: string;
}

export interface Feedback {
  id: string;
  clientId: string;
  rating: string;
  comment: string;
  date: string;
}

export interface Agent {
  id: string;
  name: string;
  uplineId: string;
  title: string;
  email: string;
  phone: string;
  joined: string;
  region: string;
  status: "Active" | "Inactive";
}

export interface Product {
  id: string;
  category: string;
  provider: string;
  product: string;
  base: number;
  advance: number;
  country: string;
}

export interface Sale {
  id: string;
  date: string;
  clientId: string;
  productId: string;
  productLabel: string;
  basePct: number;
  premium: number;
  agent: string;
  contractPct: number;
  status: "Pending" | "Paid";
}

export interface PartnerIncome {
  id: string;
  date: string;
  agent: string;
  partner: string;
  amount: number;
  note: string;
}

export interface Db {
  events: EventRecord[];
  booths: BoothRecord[];
  // Everyone: prospects and clients alike (see people.ts).
  prospects: Prospect[];
  purchases: Purchase[];
  followUps: FollowUp[];
  feedback: Feedback[];
  agents: Agent[];
}

export interface IncomeData {
  levels: number[];
  sales: Sale[];
  partner: PartnerIncome[];
}

export type ScreenId =
  | "dashboard"
  | "events"
  | "booth"
  | "pipeline"
  | "followUps"
  | "calendar"
  | "clients"
  | "applications"
  | "products"
  | "income"
  | "agents"
  | "automation"
  | "blog"
  | "data";
