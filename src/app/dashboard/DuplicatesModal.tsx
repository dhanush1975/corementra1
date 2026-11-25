import { useMemo, useState } from "react";
import { client } from "./client";
import { listAll } from "./sync";
import { STAGE_TITLES } from "./data";
import { findDuplicateGroups, mergePerson, pickKeeper, remapDb } from "./people";
import { TagPill } from "./RecordTable";
import { DBtn, Modal } from "./ui";
import type { BoothEntry, Db, IncomeData, Prospect } from "./types";

// Lists people who look like the same person and merges each group into
// one record: its events, booth analyses, applications, follow-ups, sales,
// purchases, feedback and notes all move onto the record that's kept.

export function useDuplicateCount(db: Db) {
  return useMemo(() => findDuplicateGroups(db.prospects).length, [db.prospects]);
}

// Merges `others` into `keep` everywhere: booth analyses and applications
// (outside db) are moved first, so nothing points at a removed record if
// one of those fails; then the people list, follow-ups, purchases,
// feedback and sales. Returns false (and changes nothing in db) on failure.
export async function mergeEverywhere(
  ctx: { db: Db; commit: (db: Db, msg?: string) => void; income: IncomeData; setIncome: (next: IncomeData) => void },
  keep: Prospect,
  others: Prospect[],
): Promise<boolean> {
  const { db, commit, income, setIncome } = ctx;
  const keepId = keep.id;
  const otherIds = new Set(others.map(o => o.id));
  const idMap = Object.fromEntries(others.map(o => [o.id, keepId]));

  const problems: string[] = [];
  try {
    const entries = await listAll<BoothEntry>(client.models.BoothEntry as any);
    for (const e of entries.filter(e => e.prospectId && otherIds.has(e.prospectId))) {
      const res = await client.models.BoothEntry.update({ id: e.id, prospectId: keepId });
      if (res.errors?.length) problems.push("a booth analysis");
    }
    for (const oid of otherIds) {
      const res = await client.models.Application.list({ filter: { clientId: { eq: oid } }, limit: 1000, selectionSet: ["id"] });
      if (res.errors?.length) problems.push("a questionnaire");
      for (const a of res.data ?? []) {
        const r = await client.mutations.linkApplication({ id: a.id, clientId: keepId });
        if (r.errors?.length) problems.push("a questionnaire");
      }
    }
  } catch (err) {
    console.error("Moving booth analyses / applications failed:", err);
    problems.push("booth analyses or questionnaires");
  }
  if (problems.length) {
    window.alert(`Couldn't move ${problems[0]}, so nothing was merged. Please try again.`);
    return false;
  }

  const merged = mergePerson(keep, others);
  const next = remapDb(
    { ...db, prospects: db.prospects.filter(p => !otherIds.has(p.id)).map(p => (p.id === keepId ? merged : p)) },
    idMap,
  );
  if (income.sales.some(s => otherIds.has(s.clientId))) {
    setIncome({ ...income, sales: income.sales.map(s => (otherIds.has(s.clientId) ? { ...s, clientId: keepId } : s)) });
  }
  commit(next, `Merged ${others.length + 1} records into ${keep.name}`);
  return true;
}

export function DuplicatesModal({
  db, commit, income, setIncome, onClose,
}: {
  db: Db;
  commit: (db: Db, msg?: string) => void;
  income: IncomeData;
  setIncome: (next: IncomeData) => void;
  onClose: () => void;
}) {
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [keepers, setKeepers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const groups = findDuplicateGroups(db.prospects).filter(g => !skipped.has(g.key));

  const merge = async (key: string, people: Prospect[]) => {
    const keepId = keepers[key] ?? pickKeeper(people).id;
    const keep = people.find(p => p.id === keepId)!;
    const others = people.filter(p => p.id !== keepId);
    if (!window.confirm(`Merge ${people.length} records into one "${keep.name}"? The other ${others.length === 1 ? "record is" : `${others.length} records are`} removed after everything is moved over.`)) return;
    setBusy(key);
    await mergeEverywhere({ db, commit, income, setIncome }, keep, others);
    setBusy(null);
  };

  const counts = (p: Prospect) => {
    const fu = db.followUps.filter(f => f.prospectId === p.id).length;
    const sales = income.sales.filter(s => s.clientId === p.id).length;
    return [fu && `${fu} follow-up${fu > 1 ? "s" : ""}`, sales && `${sales} sale${sales > 1 ? "s" : ""}`].filter(Boolean).join(" · ");
  };

  return (
    <Modal title="Duplicates" subtitle="Records with the same name and email are the same person. Pick the one to keep and merge." onClose={onClose} wide>
      {groups.length === 0 ? (
        <p className="text-sm text-[#98a2b3] py-4">No duplicates found.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map(g => {
            const keepId = keepers[g.key] ?? pickKeeper(g.people).id;
            return (
              <div key={g.key} className="rounded-xl border border-[#eef0f3] p-4">
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <span className="text-xs font-semibold text-[#475467]">
                    {g.exact ? "Same name and email" : "Same name, different or missing email — check before merging"}
                  </span>
                  <div className="flex items-center gap-2">
                    <DBtn variant="ghost" onClick={() => setSkipped(s => new Set(s).add(g.key))}>{g.exact ? "Skip" : "Not the same person"}</DBtn>
                    <DBtn onClick={() => merge(g.key, g.people)} disabled={busy !== null}>{busy === g.key ? "Merging…" : "Merge"}</DBtn>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  {g.people.map(p => (
                    <label key={p.id} className={`flex items-start gap-3 px-3 py-2 rounded-lg cursor-pointer text-[13px] ${keepId === p.id ? "bg-[#eaf1f9]" : "bg-[#fafbfc]"}`}>
                      <input type="radio" name={g.key} checked={keepId === p.id} onChange={() => setKeepers(k => ({ ...k, [g.key]: p.id }))} className="mt-1" />
                      <span className="flex-1 min-w-0">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-[#667085]"> · {p.email || "no email"}{p.phone ? " · " + p.phone : ""}</span>
                        <span className="block text-[11px] text-[#98a2b3]">{[p.source, counts(p), keepId === p.id ? "kept" : "merged into the kept one"].filter(Boolean).join(" · ")}</span>
                      </span>
                      <span className="flex gap-1 shrink-0">
                        <TagPill text={STAGE_TITLES[p.stage] || p.stage} />
                        {p.clientType && <TagPill text={p.clientType} />}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
