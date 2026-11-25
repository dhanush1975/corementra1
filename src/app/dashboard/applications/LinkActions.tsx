import { useEffect, useState } from "react";
import { client } from "../client";
import { DBtn } from "../ui";

// Status of a questionnaire's client link, and the Send / Resend / Copy
// buttons. A link works for 24 hours; resending makes a new one (the old
// one stops working) and emails it to the person.

export interface LinkRow {
  id: string;
  status?: string | null;
  token?: string | null;
  linkExpiresAt?: string | null;
  linkSentAt?: string | null;
  linkSentTo?: string | null;
  submittedAt?: string | null;
}

export type LinkState = "submitted" | "waiting" | "expired";

export const OPEN = "Awaiting client";

export function linkState(r: LinkRow, now = Date.now()): LinkState {
  if (r.status && r.status !== OPEN) return "submitted";
  return r.linkExpiresAt && Date.parse(r.linkExpiresAt) > now ? "waiting" : "expired";
}

const shortDay = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";

function timeLeft(iso: string, now: number) {
  const mins = Math.max(0, Math.round((Date.parse(iso) - now) / 60000));
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
}

// Re-render once a minute so "expires in" and expiry stay current.
export function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

export function LinkStatus({ row, now }: { row: LinkRow; now: number }) {
  const st = linkState(row, now);
  const styles: Record<LinkState, string> = {
    submitted: "bg-[#e7f4ec] text-[#14683f]",
    waiting: "bg-[#fdf3e7] text-[#8a5a1a]",
    expired: "bg-[#faeceb] text-[#a4372f]",
  };
  const text =
    st === "submitted" ? `Submitted${row.submittedAt ? " " + shortDay(row.submittedAt) : ""}`
    : st === "waiting" ? `Not submitted · link expires in ${timeLeft(row.linkExpiresAt!, now)}`
    : "Not submitted · link expired";
  return (
    <span className="inline-flex flex-col gap-0.5">
      <span className={`inline-flex w-max items-center text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${styles[st]}`}>{text}</span>
      {row.linkSentTo && st !== "submitted" && (
        <span className="text-[11px] text-[#98a2b3]">Emailed to {row.linkSentTo}{row.linkSentAt ? " · " + shortDay(row.linkSentAt) : ""}</span>
      )}
    </span>
  );
}

export function LinkActions({
  row, now, onIssued, compact,
}: {
  row: LinkRow;
  now: number;
  // Called with the new token/expiry/sent details after a link is made.
  onIssued: (patch: Partial<LinkRow>) => void;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState<"send" | "copy" | null>(null);
  const [copied, setCopied] = useState(false);
  const st = linkState(row, now);
  if (st === "submitted") return null;

  const issue = async (send: boolean) => {
    const res = await client.mutations.issueApplicationLink({ id: row.id, origin: window.location.origin, send });
    if (res.errors?.length || !res.data) throw new Error(res.errors?.map(e => e.message).join("; ") || "No link");
    const token = res.data.url.split("/apply/")[1];
    onIssued({
      token,
      linkExpiresAt: res.data.expiresAt,
      ...(res.data.sentTo ? { linkSentTo: res.data.sentTo, linkSentAt: new Date().toISOString() } : {}),
    });
    return res.data;
  };

  const send = async () => {
    const again = !!row.linkSentAt || st === "expired";
    if (again && !window.confirm("Send a new link? The previous link will stop working.")) return;
    setBusy("send");
    try {
      const out = await issue(true);
      window.alert(`Link emailed to ${out.sentTo}. It works for 24 hours.`);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "The link could not be sent.");
    } finally {
      setBusy(null);
    }
  };

  const copy = async () => {
    setBusy("copy");
    try {
      // A still-valid link is copied as is; an expired one is replaced.
      const url = st === "waiting" && row.token ? `${window.location.origin}/apply/${row.token}` : (await issue(false)).url;
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      } catch {
        window.prompt("Copy this link:", url);
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "The link could not be made.");
    } finally {
      setBusy(null);
    }
  };

  const sent = !!row.linkSentAt;
  return (
    <span className={`inline-flex items-center gap-1.5 ${compact ? "" : "flex-wrap"}`} onClick={e => e.stopPropagation()}>
      <DBtn variant={st === "expired" ? "primary" : "secondary"} onClick={send} disabled={busy !== null} className={compact ? "px-3 py-1.5 text-[12px]" : ""}>
        {busy === "send" ? "Sending…" : sent || st === "expired" ? "Resend link" : "Send link"}
      </DBtn>
      <DBtn variant="ghost" onClick={copy} disabled={busy !== null} className={compact ? "px-3 py-1.5 text-[12px]" : ""}>
        {copied ? "Copied!" : busy === "copy" ? "…" : st === "expired" ? "Copy new link" : "Copy link"}
      </DBtn>
    </span>
  );
}
