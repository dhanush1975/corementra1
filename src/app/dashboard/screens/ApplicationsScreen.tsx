import { useCallback, useEffect, useState } from "react";
import { client } from "../client";
import { RecordTable, type ColumnDef } from "../RecordTable";
import { SearchSelect } from "../SearchSelect";
import { DBtn, DCard, DInput, DSelect, Field, Modal } from "../ui";
import { ApplicationForm, postUpload, type DocActions } from "../applications/ApplicationForm";
import { parseQuestionnaire, type Questionnaire } from "../applications/questionnaire";
import { blankRecord } from "../forms";
import { findDuplicate, normEmail } from "../people";
import { PersonAutocomplete, TypeBadge } from "../PersonAutocomplete";
import { LinkActions, LinkStatus, OPEN, linkState, useNow } from "../applications/LinkActions";
import type { Db, Prospect } from "../types";

// Applications belong to a person (Application.clientId = their id in
// db.prospects), so they also show on that person's page.
type Client = Prospect;

// "Prospect — Name · email" — everyone in your records is searchable here,
// prospects as well as clients.
const personLabel = (p: Prospect) => `${p.clientType || "Prospect"} — ` + [p.name, p.email].filter(Boolean).join(" · ");

// What the dashboard may read of an application. The answers themselves
// are encrypted (Application.secret) and only come back decrypted, one
// application at a time, through openApplication.
export interface ApplicationRow {
  id: string;
  name: string;
  clientId?: string | null;
  status?: string | null;
  token?: string | null;
  linkExpiresAt?: string | null;
  linkSentAt?: string | null;
  linkSentTo?: string | null;
  submittedAt?: string | null;
  updatedAt?: string;
}

export const ROW_FIELDS = ["id", "name", "clientId", "status", "token", "linkExpiresAt", "linkSentAt", "linkSentTo", "submittedAt", "updatedAt"] as const;
const DONE = "Submitted";
const STATUS_LABELS: Record<string, string> = {
  [OPEN]: "Not submitted — client can fill it in",
  [DONE]: "Submitted — link closed",
};

const dateLabel = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
const errText = (res: { errors?: { message: string }[] | null }) => res.errors?.map(e => e.message).join("; ") || "";

async function listApplications(): Promise<ApplicationRow[]> {
  const rows: ApplicationRow[] = [];
  let nextToken: string | null | undefined;
  do {
    const res = await client.models.Application.list({
      limit: 1000,
      nextToken,
      // Never pull the encrypted blobs into the list.
      selectionSet: [...ROW_FIELDS],
    });
    if (res.errors?.length) throw new Error(errText(res));
    rows.push(...(res.data as ApplicationRow[]));
    nextToken = res.nextToken;
  } while (nextToken);
  return rows;
}

export function ApplicationsScreen({
  db, commit, openId, onOpened,
}: {
  db: Db;
  commit: (db: Db, msg?: string) => void;
  // An application to open straight away (from a person's page).
  openId?: string | null;
  onOpened?: () => void;
}) {
  // Loaded here rather than in useDb on purpose: everything in useDb's Db
  // goes into the JSON backup.
  const [apps, setApps] = useState<ApplicationRow[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [editing, setEditing] = useState<ApplicationRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<ApplicationRow | null>(null);
  const now = useNow();
  const patchRow = (id: string, patch: Partial<ApplicationRow>) => {
    setApps(list => list.map(a => (a.id === id ? { ...a, ...patch } : a)));
    setCreated(c => (c?.id === id ? { ...c, ...patch } : c));
  };

  const load = useCallback(() => {
    setState("loading");
    listApplications()
      .then(rows => { setApps(rows.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))); setState("ready"); })
      .catch(err => { console.error("Applications failed to load:", err); setState("error"); });
  }, []);
  useEffect(load, [load]);

  useEffect(() => {
    if (!openId || state !== "ready") return;
    const row = apps.find(a => a.id === openId);
    if (row) setEditing(row);
    else listApplications().then(rows => { setApps(rows); const r2 = rows.find(a => a.id === openId); if (r2) setEditing(r2); }).catch(() => {});
    onOpened?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId, state]);

  const del = async (rec: ApplicationRow) => {
    if (!window.confirm(`Delete ${rec.name}'s questionnaire and its uploaded documents? This can't be undone.`)) return false;
    const res = await client.mutations.deleteApplication({ id: rec.id });
    if (res.errors?.length) { console.error("Delete failed:", errText(res)); window.alert("That questionnaire could not be deleted."); return false; }
    setApps(list => list.filter(a => a.id !== rec.id));
    return true;
  };

  const afterCreate = async (id: string) => {
    setCreating(false);
    const rows = await listApplications().catch(() => null);
    if (rows) setApps(rows.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")));
    setCreated(rows?.find(r => r.id === id) ?? null);
  };

  if (editing) {
    return (
      <ApplicationEditor
        key={editing.id}
        row={editing}
        clients={db.prospects}
        onSaved={row => setApps(list => list.map(a => (a.id === row.id ? { ...a, ...row } : a)))}
        onDelete={async () => { if (await del(editing)) setEditing(null); }}
        onClose={() => setEditing(null)}
      />
    );
  }

  const columns: ColumnDef<ApplicationRow>[] = [
    {
      key: "name",
      label: "Person",
      render: r => {
        const p = db.prospects.find(x => x.id === r.clientId);
        return (
          <span className="inline-flex items-center gap-2">
            {p ? <TypeBadge person={p} /> : <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#faeceb] text-[#a4372f]">Not linked</span>}
            <span className="font-medium">{p?.name || r.name}</span>
          </span>
        );
      },
      sortValue: r => r.name,
    },
    { key: "status", label: "Submitted?", render: r => <LinkStatus row={r} now={now} />, sortValue: r => linkState(r, now) },
    { key: "link", label: "Client link", render: r => <LinkActions row={r} now={now} compact onIssued={patch => patchRow(r.id, patch)} /> },
    { key: "updated", label: "Updated", render: r => dateLabel(r.updatedAt), sortValue: r => r.updatedAt || "" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-[#98a2b3]">Book of business</div>
          <h2 className="text-2xl font-black mt-0.5">Questionnaires</h2>
          <p className="text-sm text-[#667085] mt-1">
            Send a client their questionnaire link. It works for 24 hours and can be submitted once; resend it if it expires.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DBtn variant="secondary" onClick={load}>Refresh</DBtn>
          <DBtn onClick={() => setCreating(true)}>+ New questionnaire</DBtn>
        </div>
      </div>

      {state === "error" && (
        <p className="text-sm text-[#a4372f]">Questionnaires couldn't be loaded. <button onClick={load} className="underline">Try again</button>.</p>
      )}
      {state === "loading" ? (
        <DCard className="p-5 text-sm text-[#98a2b3]">Loading…</DCard>
      ) : (
        <RecordTable<ApplicationRow>
          rows={apps}
          columns={columns}
          onEdit={setEditing}
          onDelete={r => { del(r); }}
          searchFn={(r, q) => r.name.toLowerCase().includes(q)}
        />
      )}
      <p className="text-xs text-[#98a2b3]">
        Answers and documents are encrypted with a dedicated AWS KMS key and only decrypted when you open a questionnaire here.
        They are not included in the JSON backup on the Data screen.
      </p>

      {creating && <NewApplicationModal db={db} commit={commit} onCreated={afterCreate} onClose={() => setCreating(false)} />}

      {created && (
        <Modal title="Questionnaire created" subtitle={created.name} onClose={() => setCreated(null)}>
          <p className="text-sm text-[#475467]">
            Email the link to {created.name}, or copy it to send another way. It works for 24 hours and can be submitted once.
          </p>
          <div className="flex flex-col gap-2 mt-4">
            <LinkStatus row={created} now={now} />
            <LinkActions row={created} now={now} onIssued={patch => patchRow(created.id, patch)} />
          </div>
          <p className="text-xs text-[#98a2b3] mt-4">Anyone with the link can submit the form, but no one can read answers back through it.</p>
          <div className="flex justify-between gap-2 mt-6">
            <DBtn variant="secondary" onClick={() => { const r = created; setCreated(null); setEditing(r); }}>Fill it in myself</DBtn>
            <DBtn onClick={() => setCreated(null)}>Done</DBtn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function NewApplicationModal({ db, commit, onCreated, onClose }: { db: Db; commit: (db: Db, msg?: string) => void; onCreated: (id: string) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<Prospect | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    let person = picked;
    if (!person) {
      // One record per person: someone already on file is reused.
      const draft: Prospect = { ...blankRecord("prospects"), name: name.trim().replace(/\s+/g, " "), email: normEmail(email), source: "Not captured yet", notes: "Added for a client questionnaire." };
      person = findDuplicate(db.prospects, draft) ?? null;
      if (!person) {
        person = draft;
        commit({ ...db, prospects: [draft, ...db.prospects] }, "Added " + draft.name);
      }
    }
    setBusy(true);
    const res = await client.mutations.createApplication({ name: person.name, clientId: person.id });
    setBusy(false);
    if (res.errors?.length || !res.data) { console.error("Create failed:", errText(res)); window.alert("The questionnaire could not be created."); return; }
    onCreated(res.data);
  };

  const ready = picked ? true : !!name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <Modal title="New questionnaire" subtitle="Creates a private link for the client to fill in the questionnaire." onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Field label="Name">
          <PersonAutocomplete
            value={name}
            autoFocus
            people={db.prospects}
            placeholder="Start typing a name or email…"
            onChange={t => { setName(t); setPicked(null); }}
            onPick={p => { setPicked(p); setName(p.name); }}
          />
        </Field>
        {picked ? (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-[#eaf1f9] px-4 py-3 text-[13px]">
            <span className="min-w-0">
              <span className="font-semibold">{picked.name}</span>
              <span className="text-[#667085]"> · {[picked.email, picked.clientType || "Prospect"].filter(Boolean).join(" · ")}</span>
            </span>
            <button type="button" onClick={() => { setPicked(null); setName(""); }} className="text-xs font-semibold text-[#667085] hover:text-[#0a0a0a] shrink-0">Change</button>
          </div>
        ) : name.trim() ? (
          <>
            <Field label="Email (new person)"><DInput type="email" value={email} onChange={e => setEmail(e.target.value)} /></Field>
            <p className="text-xs text-[#98a2b3] -mt-2">Not in the list? They'll be added to your Pipeline. If this name and email are already on file, that record is used instead.</p>
          </>
        ) : null}
        <div className="flex justify-end gap-2">
          <DBtn variant="secondary" onClick={onClose}>Cancel</DBtn>
          <DBtn onClick={create} disabled={busy || !ready}>{busy ? "Creating…" : "Create link"}</DBtn>
        </div>
      </div>
    </Modal>
  );
}

// ---- Editor ---------------------------------------------------------------

// Used on the Questionnaires screen and, in an overlay, on a person's page.
export function ApplicationEditor({
  row: initialRow, clients, onSaved, onDelete, onClose, backLabel = "← All questionnaires",
}: {
  row: ApplicationRow;
  clients: Client[];
  onSaved: (row: Partial<ApplicationRow> & { id: string }) => void;
  onDelete: () => void;
  onClose: () => void;
  backLabel?: string;
}) {
  // Link details change when a link is (re)sent from here.
  const [row, setRow] = useState(initialRow);
  const now = useNow();
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [saved, setSaved] = useState<{ q: Questionnaire; clientId: string; status: string } | null>(null);
  const [q, setQ] = useState<Questionnaire | null>(null);
  const [meta, setMeta] = useState({ clientId: row.clientId || "", status: row.status || OPEN });
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");

  const load = useCallback(() => {
    setLoadState("loading");
    client.queries.openApplication({ id: row.id }).then(res => {
      if (res.errors?.length || res.data == null) { console.error("Open failed:", errText(res)); setLoadState("error"); return; }
      const parsed = parseQuestionnaire(res.data);
      setQ(parsed);
      setSaved({ q: parsed, clientId: row.clientId || "", status: row.status || OPEN });
      setLoadState("ready");
    }).catch(err => { console.error("Open failed:", err); setLoadState("error"); });
  }, [row.id, row.clientId, row.status]);
  useEffect(load, [load]);

  const dirty = !!saved && !!q && (
    JSON.stringify(q) !== JSON.stringify(saved.q) || meta.clientId !== saved.clientId || meta.status !== saved.status
  );

  const docs: DocActions = {
    upload: async (who, slot, file) => {
      const res = await client.mutations.applicationUpload({ id: row.id, who, slot, contentType: file.type, size: file.size });
      if (res.errors?.length || !res.data) throw new Error(errText(res) || "No upload link");
      await postUpload(res.data, file);
      return { path: res.data.path, name: file.name };
    },
    open: async doc => {
      const res = await client.queries.applicationDocUrl({ id: row.id, path: doc.path });
      if (res.errors?.length || !res.data) throw new Error(errText(res) || "No download link");
      return res.data;
    },
  };

  const save = async () => {
    if (!q) return;
    setBusy(true);
    const res = await client.mutations.saveApplication({ id: row.id, data: JSON.stringify(q), status: meta.status, clientId: meta.clientId || undefined });
    setBusy(false);
    if (res.errors?.length || !res.data) { console.error("Save failed:", errText(res)); window.alert("The questionnaire could not be saved. Please try again."); return; }
    setSaved({ q, ...meta });
    onSaved({ id: row.id, ...meta, name: q.primary.person.fullName.trim() || row.name, updatedAt: new Date().toISOString() });
    setFlash("Saved");
    window.setTimeout(() => setFlash(""), 2000);
  };

  const close = () => {
    if (dirty && !window.confirm("Discard your unsaved changes?")) return;
    onClose();
  };

  const prefill = (c: Client) => {
    setMeta(m => ({ ...m, clientId: c.id }));
    setQ(prev => {
      if (!prev) return prev;
      const p = prev.primary.person;
      return {
        ...prev,
        primary: {
          ...prev.primary,
          person: {
            ...p,
            fullName: p.fullName || c.name || "",
            email: p.email || c.email || "",
            phone: p.phone || c.phone || "",
            address: p.address || c.address || "",
            dob: p.dob || c.birthday || "",
          },
        },
      };
    });
  };

  const title = q?.primary.person.fullName.trim() || row.name;

  return (
    <div className="flex flex-col gap-4 max-w-[960px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button onClick={close} className="text-xs text-[#667085] hover:text-[#0a0a0a]">{backLabel}</button>
          <h2 className="text-2xl font-black mt-1">{title}</h2>
          <div className="mt-2"><LinkStatus row={{ ...row, status: saved?.status ?? row.status }} now={now} /></div>
        </div>
        {loadState === "ready" && (
          <div className="flex items-center gap-2">
            {flash && <span className="text-xs font-semibold text-[#14683f]">{flash}</span>}
            {!dirty && !flash && <span className="text-xs text-[#98a2b3]">All changes saved</span>}
            <DBtn variant="secondary" onClick={close}>{dirty ? "Cancel" : "Done"}</DBtn>
            <DBtn onClick={save} disabled={busy || !dirty}>{busy ? "Saving…" : "Save"}</DBtn>
          </div>
        )}
      </div>

      {loadState === "loading" && <DCard className="p-5 text-sm text-[#98a2b3]">Decrypting…</DCard>}
      {loadState === "error" && (
        <DCard className="p-5 text-sm text-[#a4372f]">This questionnaire couldn't be opened. <button onClick={load} className="underline">Try again</button>.</DCard>
      )}

      {loadState === "ready" && q && (
        <>
          <DCard className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Person this questionnaire belongs to (fills in blank name, email, phone, address, DOB)">
              <SearchSelect options={clients} value={meta.clientId} labelOf={personLabel} onSelect={prefill} placeholder="Search everyone — prospects and clients…" />
            </Field>
            <Field label="Status">
              <DSelect value={meta.status} onChange={e => setMeta(m => ({ ...m, status: e.target.value }))}>
                {[OPEN, DONE].map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </DSelect>
            </Field>
            {saved?.status === OPEN && (
              <div className="md:col-span-2 flex items-center gap-3 flex-wrap rounded-xl bg-[#fdf3e7] px-4 py-3 text-xs text-[#8a5a1a]">
                <span className="flex-1 min-w-[240px]">
                  Not submitted yet. If the client submits through their link, their answers replace what's saved here. Set the status to Submitted to close the link.
                </span>
                <LinkActions
                  row={{ ...row, status: saved.status }}
                  now={now}
                  onIssued={patch => { setRow(r0 => ({ ...r0, ...patch })); onSaved({ id: row.id, ...patch }); }}
                />
              </div>
            )}
          </DCard>

          <ApplicationForm
            value={q}
            onChange={setQ}
            docs={docs}
            audience="agent"
            people={clients}
            // Picking the primary insured links the questionnaire to them.
            onPickPerson={(who, p) => { if (who === "primary") setMeta(m => ({ ...m, clientId: p.id })); }}
          />

          <div className="flex items-center justify-between gap-2 pt-2 pb-8">
            <DBtn variant="danger" onClick={onDelete}>Delete questionnaire</DBtn>
            <DBtn onClick={save} disabled={busy || !dirty}>{busy ? "Saving…" : "Save"}</DBtn>
          </div>
        </>
      )}
    </div>
  );
}
