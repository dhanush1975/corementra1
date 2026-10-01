import { useState } from "react";
import { ENTITY_FIELDS, ENTITY_META, optionsFor } from "./forms";
import { DBtn, DInput, DSelect, DTextarea, Field, Modal } from "./ui";
import type { Agent, Db } from "./types";

export function RecordModal({
  entityKey,
  record,
  db,
  agents,
  onSave,
  onDelete,
  onClose,
}: {
  entityKey: string;
  record: any;
  db: Db;
  agents: Agent[];
  onSave: (rec: any) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<any>(record);
  const fields = ENTITY_FIELDS[entityKey] || [];
  const isNew = !(db as any)[entityKey]?.some((r: any) => r.id === draft.id);
  const meta = ENTITY_META[entityKey];

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setDraft((d: any) => ({ ...d, [k]: e.target.value }));
  };

  return (
    <Modal title={(isNew ? "New " : "Edit ") + meta.singular} subtitle="Saved to this browser immediately." onClose={onClose} wide>
      <form
        onSubmit={e => {
          e.preventDefault();
          onSave(draft);
        }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {fields.map(f => (
          <div key={f.k} className={f.span2 ? "sm:col-span-2" : ""}>
            <Field label={f.l}>
              {f.t === "select" ? (
                <DSelect value={draft[f.k] ?? ""} onChange={set(f.k)}>
                  {optionsFor(f, db, agents, draft).map(o => (
                    <option key={o.v} value={o.v}>{o.l}</option>
                  ))}
                </DSelect>
              ) : f.t === "area" ? (
                <DTextarea value={draft[f.k] ?? ""} onChange={set(f.k)} />
              ) : (
                <DInput type={f.t === "number" ? "number" : f.t === "date" ? "date" : "text"} value={draft[f.k] ?? ""} onChange={set(f.k)} />
              )}
            </Field>
          </div>
        ))}
        <div className="sm:col-span-2 flex items-center justify-end gap-2 mt-1">
          {onDelete && !isNew && (
            <DBtn variant="danger" onClick={onDelete} className="mr-auto">Delete</DBtn>
          )}
          <DBtn variant="secondary" onClick={onClose}>Cancel</DBtn>
          <DBtn type="submit">Save record</DBtn>
        </div>
      </form>
    </Modal>
  );
}
