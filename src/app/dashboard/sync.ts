type ModelOps<T> = {
  list: (args?: { nextToken?: string | null; limit?: number }) => Promise<{ data: T[]; nextToken?: string | null }>;
  create: (input: any) => Promise<any>;
  update: (input: any) => Promise<any>;
  delete: (input: { id: string }) => Promise<any>;
};

export async function listAll<T extends { id: string }>(model: ModelOps<T>): Promise<T[]> {
  let items: T[] = [];
  let nextToken: string | null | undefined;
  do {
    const res = await model.list({ nextToken, limit: 1000 });
    items = items.concat(res.data);
    nextToken = res.nextToken;
  } while (nextToken);
  return items;
}

/**
 * Diffs `nextList` against `prevList` by id and fires the matching
 * create/update/delete calls at the Amplify Data client. Fire-and-forget:
 * callers already update local React state optimistically and synchronously,
 * this just reconciles the backend in the background.
 */
export function diffAndSync<T extends { id: string }>(
  model: ModelOps<T>,
  prevList: T[],
  nextList: T[],
  onError?: (failures: PromiseRejectedResult[]) => void,
) {
  const prevMap = new Map(prevList.map(r => [r.id, r]));
  const nextMap = new Map(nextList.map(r => [r.id, r]));
  const ops: Promise<any>[] = [];

  // The generated client resolves (doesn't throw) on a GraphQL validation
  // error — it just returns { data: null, errors: [...] } — so without this,
  // Promise.allSettled sees every failed write as "fulfilled" and the
  // onError warning below never fires, silently dropping the change.
  const guarded = (p: Promise<any>) => p.then(res => {
    if (res?.errors?.length) throw new Error(res.errors.map((e: any) => e.message).join("; "));
    return res;
  });

  for (const [id, rec] of nextMap) {
    const prevRec = prevMap.get(id);
    if (!prevRec) ops.push(guarded(model.create(rec)));
    else if (JSON.stringify(prevRec) !== JSON.stringify(rec)) ops.push(guarded(model.update(rec)));
  }
  for (const id of prevMap.keys()) {
    if (!nextMap.has(id)) ops.push(guarded(model.delete({ id })));
  }

  if (!ops.length) return;
  Promise.allSettled(ops).then(results => {
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    if (failed.length) {
      failed.forEach(f => console.error("Sync failed:", f.reason));
      onError?.(failed);
    }
  });
}
