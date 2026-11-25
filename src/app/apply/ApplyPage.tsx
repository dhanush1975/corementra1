import { useEffect, useState } from "react";
import { useParams } from "react-router";
import logo from "@/imports/logo/corementra-logo-trimmed.png";
import { client } from "../dashboard/client";
import { DBtn, DCard } from "../dashboard/ui";
import { ApplicationForm, postUpload, type DocActions } from "../dashboard/applications/ApplicationForm";
import { blankQuestionnaire, type Questionnaire } from "../dashboard/applications/questionnaire";

// The link the agent sends a client: /apply/<token>. The client fills in
// the questionnaire once and submits it. Everything goes to the
// applications function (amplify/functions/applications), which encrypts
// it before storing. This page can never read anything back.

// Same rules the server enforces.
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .,'’-]{0,79}$/u;
const EMAIL_RE = /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;
const PHONE_RE = /^[+(]?[0-9][0-9 ().-]{5,24}$/;

type PageState = "loading" | "invalid" | "expired" | "submitted" | "open" | "done";

export function ApplyPage() {
  const { token = "" } = useParams();
  const [page, setPage] = useState<PageState>("loading");
  const [q, setQ] = useState<Questionnaire>(blankQuestionnaire);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Client questionnaire — CoreMentra";
    client.queries.getPublicApplication({ token }, { authMode: "apiKey" })
      .then(res => {
        if (!res.data) setPage("invalid");
        else setPage(res.data.status === "open" ? "open" : res.data.status === "expired" ? "expired" : "submitted");
      })
      .catch(() => setPage("invalid"));
  }, [token]);

  // Nothing typed here is saved until Submit, so warn before leaving.
  useEffect(() => {
    if (page !== "open") return;
    const onLeave = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [page]);

  const docs: DocActions = {
    upload: async (who, slot, file) => {
      const res = await client.mutations.publicApplicationUpload(
        { token, who, slot, contentType: file.type, size: file.size },
        { authMode: "apiKey" },
      );
      if (res.errors?.length || !res.data) throw new Error(res.errors?.[0]?.message || "No upload link");
      await postUpload(res.data, file);
      return { path: res.data.path, name: file.name };
    },
  };

  const submit = async () => {
    const p = q.primary.person;
    const name = p.fullName.trim().replace(/\s+/g, " ");
    const err = !NAME_RE.test(name) ? "Please enter your full name as per your ID (letters only)."
      : !p.dob ? "Please enter your date of birth."
      : !PHONE_RE.test(p.phone.trim()) ? "Please enter a valid phone number."
      : !EMAIL_RE.test(p.email.trim()) ? "Please enter a valid email address."
      : "";
    setError(err);
    if (err) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    if (!window.confirm("Submit your questionnaire? You won't be able to change it through this link afterwards.")) return;

    setBusy(true);
    try {
      const res = await client.mutations.submitApplication({ token, data: JSON.stringify(q) }, { authMode: "apiKey" });
      if (res.errors?.some(e => /expired/i.test(e.message))) { setPage("expired"); window.scrollTo({ top: 0 }); return; }
      if (res.errors?.length || !res.data) {
        setError(res.errors?.[0]?.message || "We could not submit your questionnaire — please try again.");
        return;
      }
      // Drop the answers from memory as soon as they're stored.
      setQ(blankQuestionnaire());
      setPage("done");
      window.scrollTo({ top: 0 });
    } catch {
      setError("We could not submit your questionnaire — please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#0a0a0a]" style={{ fontFamily: "Inter, sans-serif" }}>
      <header className="bg-white border-b border-[#e5e5e5]">
        <div className="max-w-[880px] mx-auto px-4 sm:px-6 h-16 flex items-center">
          <a href="/"><img src={logo} alt="CoreMentra" className="h-8 w-auto" /></a>
        </div>
      </header>

      <main className="max-w-[880px] mx-auto px-4 sm:px-6 py-8">
        {page === "loading" && <p className="text-sm text-[#98a2b3] text-center py-16">Loading…</p>}

        {page === "invalid" && (
          <Notice title="This link isn't valid">Please check the link you were sent, or contact your agent for a new one.</Notice>
        )}
        {page === "expired" && (
          <Notice title="This link has expired">For your security, questionnaire links work for 24 hours. Please ask your agent to send you a new one.</Notice>
        )}
        {page === "submitted" && (
          <Notice title="Already submitted">This questionnaire has already been submitted. If something needs to change, please contact your agent.</Notice>
        )}
        {page === "done" && (
          <Notice title="Thank you — your questionnaire is submitted">
            Your information has been received securely. Your agent will review it and get in touch about next steps.
          </Notice>
        )}

        {page === "open" && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black">Client questionnaire</h1>
              <p className="text-sm text-[#667085] mt-2 leading-relaxed">
                Please fill in this information accurately, to the best of your knowledge, for a trial application for your life insurance.
              </p>
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#e7f4ec] px-4 py-3 text-xs text-[#14683f] leading-relaxed">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-px"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
                <span>Your answers and documents are sent over an encrypted connection and stored encrypted. Only your agent can see them. Nothing is saved until you press Submit, so please complete it in one go.</span>
              </div>
            </div>

            {error && <div className="rounded-xl bg-[#faeceb] px-4 py-3 text-sm text-[#a4372f]">{error}</div>}

            <ApplicationForm value={q} onChange={setQ} docs={docs} audience="client" />

            {error && <div className="rounded-xl bg-[#faeceb] px-4 py-3 text-sm text-[#a4372f]">{error}</div>}
            <div className="flex justify-end pb-10">
              <DBtn onClick={submit} disabled={busy} className="px-6 py-3 text-[15px]">{busy ? "Submitting…" : "Submit questionnaire"}</DBtn>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <DCard className="p-8 text-center max-w-[560px] mx-auto mt-8">
      <h1 className="text-xl font-black">{title}</h1>
      <p className="text-sm text-[#667085] mt-2 leading-relaxed">{children}</p>
    </DCard>
  );
}
