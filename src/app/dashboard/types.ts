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
}

export interface Client {
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
  prospects: Prospect[];
  clients: Client[];
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
  | "pipeline"
  | "followUps"
  | "calendar"
  | "clients"
  | "products"
  | "income"
  | "agents"
  | "data";
