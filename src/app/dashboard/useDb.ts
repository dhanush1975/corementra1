import { useCallback, useEffect, useRef, useState } from "react";
import { client } from "./client";
import { diffAndSync, listAll } from "./sync";
import { EMPTY_DB, seed } from "./data";
import type { Db } from "./types";

const MODELS = {
  events: client.models.Event,
  prospects: client.models.Prospect,
  clients: client.models.Client,
  purchases: client.models.Purchase,
  followUps: client.models.FollowUp,
  feedback: client.models.Feedback,
  agents: client.models.Agent,
} as const;

export function useDb() {
  const [db, setDb] = useState<Db>(EMPTY_DB);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const dbRef = useRef(db);
  dbRef.current = db;

  useEffect(() => {
    (async () => {
      const keys = Object.keys(MODELS) as (keyof typeof MODELS)[];
      const entries = await Promise.all(keys.map(async key => [key, await listAll(MODELS[key] as any)] as const));
      setDb(Object.fromEntries(entries) as unknown as Db);
      setLoading(false);
    })();
  }, []);

  const commit = useCallback((next: Db, message?: string) => {
    const prev = dbRef.current;
    // Update the ref immediately (not just via the `dbRef.current = db` line
    // above, which only runs on the next render) so a second commit() fired
    // before React re-renders still diffs against this commit's result
    // instead of a stale snapshot — otherwise diffAndSync could see a
    // record this commit just created as "new" again and double-create it.
    dbRef.current = next;
    setDb(next);
    if (message) {
      setToast(message);
      window.setTimeout(() => setToast(""), 2600);
    }
    (Object.keys(MODELS) as (keyof typeof MODELS)[]).forEach(key => {
      diffAndSync(MODELS[key] as any, prev[key] as any[], next[key] as any[], failed => {
        setToast(`Warning: ${failed.length} change(s) to ${key} failed to save`);
      });
    });
  }, []);

  const resetSeed = useCallback(() => {
    if (window.confirm("Replace all records with the sample data?")) commit(seed(), "Sample data restored");
  }, [commit]);

  const resetEmpty = useCallback(() => {
    if (window.confirm("Delete every record? Export a backup first if you need one.")) {
      commit(EMPTY_DB, "All records cleared");
    }
  }, [commit]);

  return { db, commit, toast, setToast, resetSeed, resetEmpty, loading };
}
