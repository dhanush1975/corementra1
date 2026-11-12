import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import logo from "@/imports/logo/corementra-logo-trimmed.png";
import { client } from "../dashboard/client";
import { CALENDLY_ORIGIN, calendlyEmbedUrl } from "../dashboard/EventRsvpPage";
import {
  ASKED, ASSETS, COUNT_KEYS, QUESTIONS, computeAnalysis, emptyAnalysis, fmtMoney,
  type Analysis, type QuestionKey, type ValueKey, type YesNo,
} from "./fna";

// Public page behind each booth's link (/booth/:boothId), used on the
// booth's tablet or laptop. The visitor's details and analysis go to the
// cloud through saveBoothAnalysis (amplify/functions/public-rsvp), which
// re-validates all of it; the dashboard's Booth screen shows it back.

type LoadStatus = "loading" | "notFound" | "loadError" | "completed" | "ready";
// 1–3 are the tabs; 4 is booking a meeting, 5 the thank-you after it.
type Step = 0 | 1 | 2 | 3 | 4 | 5;
type ClientDetails = { name: string; email: string; phone: string };

interface PageState {
  // Set by the first successful save; later saves update that entry.
  entryId: string;
  step: Step;
  client: ClientDetails;
  a: Analysis;
  savedAt: string | null;
  // JSON of the analysis as last saved, to tell whether there are unsaved changes.
  savedJson: string;
}

// Same rules the server enforces (amplify/functions/public-rsvp/handler.ts).
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .,'’-]{0,79}$/u;
const EMAIL_RE = /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;
const PHONE_RE = /^[+(]?[0-9][0-9 ().-]{5,24}$/;

const freshState = (): PageState => ({ entryId: "", step: 0, client: { name: "", email: "", phone: "" }, a: emptyAnalysis(), savedAt: null, savedJson: "" });

// The analysis in progress survives a reload of the booth's device. It is
// per booth, and cleared by "New client".
const storageKey = (boothId: string) => "fna-booth-" + boothId;
function loadState(boothId: string): PageState {
  try {
    const raw = localStorage.getItem(storageKey(boothId));
    if (raw) {
      const s = JSON.parse(raw);
      const base = freshState();
      return { ...base, ...s, client: { ...base.client, ...s.client }, a: { ...base.a, ...s.a, v: { ...base.a.v, ...s.a?.v } } };
    }
  } catch { /* storage unavailable or corrupt: start fresh */ }
  return freshState();
}

const STEPS: [string, string][] = [["01", "Responsibility"], ["02", "Income Ratio"], ["03", "Questions"]];

export function BoothAnalysisPage() {
  const { boothId = "" } = useParams<{ boothId: string }>();
  const [load, setLoad] = useState<LoadStatus>("loading");
  const [boothName, setBoothName] = useState("");
  const [s, setS] = useState<PageState>(() => loadState(boothId));
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const stateRef = useRef(s);
  // The analysis JSON of the last save that failed, so auto-save doesn't
  // retry it in a loop (and trip the API's rate limit) — the next change does.
  const failedJsonRef = useRef("");
  stateRef.current = s;

  useEffect(() => {
    if (!boothId) { setLoad("notFound"); return; }
    client.queries.getPublicBooth({ id: boothId }, { authMode: "apiKey" })
      .then(res => {
        if (res.data) {
          setBoothName(res.data.name);
          setLoad(res.data.status === "Completed" ? "completed" : "ready");
        } else if (res.errors?.length) {
          console.error("Booth lookup errors:", res.errors);
          setLoad("loadError");
        } else {
          setLoad("notFound");
        }
      })
      .catch(err => { console.error("Booth lookup failed:", err); setLoad("loadError"); });
  }, [boothId]);

  useEffect(() => {
    try { localStorage.setItem(storageKey(boothId), JSON.stringify(s)); } catch { /* storage unavailable */ }
  }, [boothId, s]);

  const save = async (): Promise<boolean> => {
    const cur = stateRef.current;
    const analysis = JSON.stringify(cur.a);
    setSaving(true);
    setSaveError("");
    try {
      const res = await client.mutations.saveBoothAnalysis(
        { boothId, entryId: cur.entryId || undefined, ...cur.client, analysis },
        { authMode: "apiKey" },
      );
      if (res.errors?.length || !res.data) {
        failedJsonRef.current = analysis;
        setSaveError(res.errors?.[0]?.message || "We couldn't save this analysis — please try again.");
        return false;
      }
      const entryId = res.data;
      setS(prev => ({ ...prev, entryId, savedAt: new Date().toISOString(), savedJson: analysis }));
      return true;
    } catch (err) {
      console.error("Save failed:", err);
      failedJsonRef.current = analysis;
      setSaveError("We couldn't reach the server — check the connection and try again.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // The Questions step has no Save button: answers save themselves shortly
  // after each change. A change made mid-save is still dirty once that save
  // lands, so it gets picked up on the next run.
  useEffect(() => {
    const json = JSON.stringify(s.a);
    if (s.step !== 3 || !s.entryId || saving || json === s.savedJson || json === failedJsonRef.current) return;
    const t = window.setTimeout(() => save(), 600);
    return () => window.clearTimeout(t);
  }, [s.step, s.entryId, s.a, s.savedJson, saving]);

  const setA = (fn: (a: Analysis) => Analysis) => setS(prev => ({ ...prev, a: fn(prev.a) }));
  const go = (step: Step) => {
    setS(prev => ({ ...prev, step }));
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Moving between steps is a natural checkpoint, so save on the way.
    if (stateRef.current.entryId) save();
  };

  const start = async () => {
    const c = { name: s.client.name.trim().replace(/\s+/g, " "), email: s.client.email.trim(), phone: s.client.phone.trim() };
    const err = !c.name || !c.email || !c.phone ? "Please fill in all required fields."
      : !NAME_RE.test(c.name) ? "Please enter a name using letters only (up to 80 characters)."
      : !EMAIL_RE.test(c.email) ? "Please enter a valid email address."
      : !PHONE_RE.test(c.phone) ? "Please enter a valid phone number, e.g. +1 555 000 0000."
      : "";
    setFormError(err);
    if (err) return;
    setS(prev => ({ ...prev, client: c }));
    stateRef.current = { ...stateRef.current, client: c };
    if (await save()) {
      setS(prev => ({ ...prev, step: 1 }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Same Calendly scheduler as the event page, prefilled with this client.
  // Built once per visit to the step so a re-render can't reload the iframe
  // and lose a booking in progress.
  const calendlySrc = useMemo(
    () => (s.step === 4 ? calendlyEmbedUrl(s.client) : ""),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [s.step === 4],
  );

  // Calendly posts this only once a time is actually booked. The booking is
  // recorded on the entry (and moves the prospect to APPOINTMENT) before
  // the thank-you shows.
  const confirmBooking = async () => {
    stateRef.current = { ...stateRef.current, a: { ...stateRef.current.a, booked: true } };
    setA(x => ({ ...x, booked: true }));
    if (await save()) setS(prev => ({ ...prev, step: 5 }));
  };
  useEffect(() => {
    if (s.step !== 4) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin === CALENDLY_ORIGIN && e.data?.event === "calendly.event_scheduled") confirmBooking();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.step]);

  const resetForNext = () => {
    setS(freshState());
    setFormError("");
    setSaveError("");
  };
  // Kiosk mode, as on the event page: back to a blank form for the next guest.
  useEffect(() => {
    if (s.step !== 5) return;
    const t = window.setTimeout(resetForNext, 8000);
    return () => window.clearTimeout(t);
  }, [s.step]);

  const newClient = () => {
    const dirty = s.step > 0 && JSON.stringify(s.a) !== s.savedJson;
    if (s.step === 5) { resetForNext(); return; }
    if (s.step > 0 && !window.confirm(dirty ? "This analysis has unsaved changes. Start a new client anyway?" : "Start a new client? This analysis is saved and the form will clear.")) return;
    setS(freshState());
    setFormError("");
    setSaveError("");
  };

  // ---- derived values ---------------------------------------------------
  const a = s.a;
  const v = a.v;
  const calc = computeAnalysis(a);
  const m = (n: number) => fmtMoney(n);
  const moneyInput = (n: number) => (n ? n.toLocaleString("en-US") : "");
  const digits = (val: string) => Number(val.replace(/[^\d]/g, "")) || 0;
  const valueProps = (k: ValueKey) => ({
    inputMode: "numeric" as const,
    placeholder: "0",
    value: COUNT_KEYS.includes(k) ? String(v[k]) : moneyInput(v[k]),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const n = digits(e.target.value);
      setA(x => ({ ...x, v: { ...x.v, [k]: n } }));
    },
  });
  const answer = (k: QuestionKey, val: YesNo) => setA(x => ({ ...x, ans: { ...x.ans, [k]: val } }));
  const dirty = JSON.stringify(a) !== s.savedJson;
  const savedLabel = saving ? "Saving…"
    : s.savedAt ? (dirty ? "Unsaved changes" : "Saved " + new Date(s.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
    : "Not saved yet";

  const yesNoButtons = (k: QuestionKey) => (
    <div className="fna-yn">
      {(["Y", "N"] as YesNo[]).map(val => (
        <button key={val} type="button" className={"fna-toggle" + (a.ans[k] === val ? " on" : "")} onClick={() => answer(k, val)}>
          {val === "Y" ? "Yes" : "No"}
        </button>
      ))}
    </div>
  );
  const question = (num: string, k: QuestionKey, last?: boolean) => (
    <div key={k} className={"fna-q" + (last ? " last" : "")}>
      <span className="fna-num">{num}</span>
      <span className="fna-q-text">{QUESTIONS.find(q => q.key === k)!.text}</span>
      {yesNoButtons(k)}
    </div>
  );
  const saveErrorLine = saveError ? <p className="fna-error" style={{ textAlign: "center" }}>{saveError}</p> : null;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');" + STYLES}</style>
      <div className="fna-page">
        <header className="fna-header">
          <a className="fna-brand" href="/"><img src={logo} alt="CoreMentra" className="fna-logo" /></a>
          {boothName && <span className="fna-booth">{boothName}</span>}
        </header>

        <main className="fna-main">
          {load === "loading" && <p className="fna-muted" style={{ textAlign: "center" }}>Loading…</p>}

          {load === "notFound" && (
            <Notice title="Link not valid">This booth link isn't valid or the booth no longer exists.</Notice>
          )}
          {load === "loadError" && (
            <Notice title="Couldn't load this page">Something blocked the connection (not a bad link) — try disabling browser extensions or opening this in a private window.</Notice>
          )}
          {load === "completed" && (
            <Notice title="This booth has closed">{boothName ? `${boothName} is` : "This booth is"} marked completed, so new analyses can't be saved here.</Notice>
          )}

          {load === "ready" && (
            <>
              <header className="fna-hero">
                <h1>Your Family's <span className="fna-grad">Financial Needs Analysis</span></h1>
                <p className="fna-lead">Work out what your family would need if something happened, and how each partner's share can be protected.</p>
                <div className="fna-meta">
                  {s.step > 0 && s.step < 5 && <span>{s.client.name} · {s.client.phone}</span>}
                  {s.step > 0 && s.step < 5 && <span>{savedLabel}</span>}
                  <button type="button" className="fna-link" onClick={newClient}>New client</button>
                </div>
              </header>

              {s.step === 0 && (
                <section className="fna-narrow">
                  <div className="fna-head">
                    <h2>Let's Get Started</h2>
                    <p>Enter your details to begin the analysis.</p>
                  </div>
                  <form className="fna-card fna-stack" onSubmit={e => { e.preventDefault(); start(); }}>
                    {([["name", "Full Name", "text", "e.g. Jane Doe", 80], ["email", "Email", "email", "e.g. jane.doe@company.com", 254], ["phone", "Phone Number", "tel", "e.g. +1 555 000 0000", 25]] as const).map(([k, label, type, ph, max]) => (
                      <label key={k} className="fna-label">
                        <span>{label}<span className="fna-req">*</span></span>
                        <input className="fna-input" type={type} placeholder={ph} maxLength={max} value={s.client[k]} onChange={e => { const val = e.target.value; setS(prev => ({ ...prev, client: { ...prev.client, [k]: val } })); }} />
                      </label>
                    ))}
                    {formError && <div className="fna-error">{formError}</div>}
                    {saveError && <div className="fna-error">{saveError}</div>}
                    <button type="submit" className="fna-btn-primary" disabled={saving}>{saving ? "Starting…" : "Start Analysis →"}</button>
                  </form>
                </section>
              )}

              {s.step > 0 && s.step < 4 && (
                <nav className="fna-steps">
                  <div>
                    {STEPS.map(([num, label], i) => (
                      <button key={num} type="button" className={s.step === i + 1 ? "on" : ""} onClick={() => go((i + 1) as Step)}>
                        <span>{num}</span>{label}
                      </button>
                    ))}
                  </div>
                </nav>
              )}

              {s.step === 1 && (
                <section className="fna-stack-lg">
                  <div className="fna-head">
                    <h2>Responsibility Calculation</h2>
                    <p>Liabilities − Assets = Responsibilities</p>
                  </div>
                  <div className="fna-grid-2">
                    <div className="fna-card">
                      <h3>Liabilities</h3>
                      <div className="fna-row">
                        <div><div className="fna-row-title">Debt</div><div className="fna-row-note">Credit card, car loan, personal loan etc. — other than mortgage</div></div>
                        <input className="fna-input fna-num-input" {...valueProps("debt")} />
                      </div>
                      <div className="fna-block">
                        <div className="fna-block-head">
                          <div><div className="fna-row-title">Income Replacement</div><div className="fna-row-note">{m(v.inc)} per year × {v.years} years</div></div>
                          <div className="fna-amount">{m(calc.incomeRep)}</div>
                        </div>
                        <div className="fna-sub" style={{ gridTemplateColumns: "minmax(0,1fr) 84px" }}>
                          <label className="fna-label-sm"><span>Yearly household income</span><input className="fna-input fna-num-input" {...valueProps("inc")} /></label>
                          <label className="fna-label-sm"><span>Years</span><input className="fna-input fna-num-input" {...valueProps("years")} /></label>
                        </div>
                      </div>
                      <div className="fna-row">
                        <div><div className="fna-row-title">Mortgage</div><div className="fna-row-note">Home and business property</div></div>
                        <input className="fna-input fna-num-input" {...valueProps("mortgage")} />
                      </div>
                      <div className="fna-block last">
                        <div className="fna-block-head">
                          <div><div className="fna-row-title">Education</div><div className="fna-row-note">{m(v.eduCost)} per year × {v.eduYears} years = {m(calc.perKid)} per kid × {v.kids} {v.kids === 1 ? "kid" : "kids"}</div></div>
                          <div className="fna-amount">{m(calc.edu)}</div>
                        </div>
                        <div className="fna-sub" style={{ gridTemplateColumns: "minmax(0,1fr) 84px 84px" }}>
                          <label className="fna-label-sm"><span>Cost per year (per kid)</span><input className="fna-input fna-num-input" {...valueProps("eduCost")} /></label>
                          <label className="fna-label-sm"><span>Years</span><input className="fna-input fna-num-input" {...valueProps("eduYears")} /></label>
                          <label className="fna-label-sm"><span>No. of kids</span><input className="fna-input fna-num-input" {...valueProps("kids")} /></label>
                        </div>
                      </div>
                      <div className="fna-total"><span>Total liabilities</span><strong>{m(calc.liabilities)}</strong></div>
                    </div>

                    <div className="fna-card">
                      <h3>Assets</h3>
                      {ASSETS.map(([k, label]) => (
                        <div key={k} className="fna-row plain">
                          <div className="fna-row-title">{label}</div>
                          <input className="fna-input fna-num-input" {...valueProps(k)} />
                        </div>
                      ))}
                      <div className="fna-total" style={{ marginTop: 12 }}><span>Total assets</span><strong>{m(calc.assets)}</strong></div>
                    </div>
                  </div>

                  <div className="fna-card fna-stack">
                    <h3 style={{ margin: 0 }}>Responsibility</h3>
                    <div className="fna-equation">
                      <div className="fna-eq-box"><div>Liabilities</div><strong>{m(calc.liabilities)}</strong></div>
                      <span className="fna-op">−</span>
                      <div className="fna-eq-box"><div>Assets</div><strong>{m(calc.assets)}</strong></div>
                      <span className="fna-op">=</span>
                      <div className="fna-eq-box hl"><div>Total Responsibilities</div><strong>{m(calc.responsibility)}</strong></div>
                    </div>
                    {calc.surplus > 0 && <div className="fna-muted">Assets exceed liabilities by {m(calc.surplus)}</div>}
                  </div>
                  {saveErrorLine}
                  <div className="fna-actions">
                    <button type="button" className="fna-btn-secondary" onClick={() => save()} disabled={saving}>Save</button>
                    <button type="button" className="fna-btn-primary" onClick={() => go(2)}>Continue to Income Ratio →</button>
                  </div>
                </section>
              )}

              {s.step === 2 && (
                <section className="fna-stack-lg">
                  <div className="fna-head">
                    <h2>Income Ratio</h2>
                    <p>Each person's share of the total responsibility of {m(calc.responsibility)}.</p>
                  </div>
                  <div className="fna-bar"><div style={{ width: (calc.people[0].share * 100).toFixed(1) + "%" }} /></div>
                  <div className="fna-grid-2">
                    {calc.people.map((p, i) => (
                      <div key={i} className="fna-card fna-stack">
                        <div className="fna-kicker">{i ? "Wife / Person 2" : "Husband / Person 1"}</div>
                        <input className="fna-input fna-name-input" maxLength={40} value={i ? a.p2 : a.p1} onChange={e => { const val = e.target.value; setA(x => ({ ...x, [i ? "p2" : "p1"]: val })); }} />
                        <div className="fna-between">
                          <span className="fna-soft">Income ratio</span>
                          <div className="fna-pct">
                            <input className="fna-input fna-num-input" inputMode="numeric" value={String(Math.round(p.share * 100))} onChange={e => { const n = Math.min(100, digits(e.target.value)); setA(x => ({ ...x, r1: i ? 100 - n : n })); }} />
                            <span>%</span>
                          </div>
                        </div>
                        <div className="fna-between fna-small">
                          <span className="fna-muted">{Math.round(p.share * 100)}% of total responsibility</span>
                          <strong>{Math.round(p.share * 100)}% of {m(calc.responsibility)}</strong>
                        </div>
                        <div className="fna-total"><span>{p.name} responsibility</span><strong className="fna-accent">{m(p.resp)}</strong></div>
                      </div>
                    ))}
                  </div>
                  {saveErrorLine}
                  <div className="fna-actions">
                    <button type="button" className="fna-btn-secondary" onClick={() => go(1)}>← Back</button>
                    <button type="button" className="fna-btn-secondary" onClick={() => save()} disabled={saving}>Save</button>
                    <button type="button" className="fna-btn-primary" onClick={() => go(3)}>Continue to Questions →</button>
                  </div>
                </section>
              )}

              {s.step === 3 && (
                <section className="fna-stack-lg fna-mid">
                  <div className="fna-head"><h2>Questions</h2></div>
                  <div className="fna-fact">
                    <div>Fact</div>
                    <p>If something happens to you, you'd be leaving family without income for mortgage and education for kids.</p>
                  </div>
                  <div className="fna-card fna-card-list">
                    {ASKED.map((k, i) => question("0" + (i + 1), k, i === ASKED.length - 1))}
                  </div>
                  {saveErrorLine}
                  <div className="fna-actions">
                    <button type="button" className="fna-btn-secondary" onClick={() => go(2)}>← Back</button>
                    <button type="button" className="fna-btn-primary" onClick={() => go(4)}>Book a meeting →</button>
                  </div>
                  <p className="fna-soft" style={{ textAlign: "center" }}>Let's look at options to solve your problem.</p>
                </section>
              )}

              {s.step === 4 && (
                <section className="fna-stack-lg fna-mid">
                  <div className="fna-head">
                    <h2>Pick a Time to Meet</h2>
                    <p>Your details are filled in for you — choose a time below.</p>
                  </div>
                  <div className="fna-card" style={{ padding: 0, overflow: "hidden" }}>
                    <iframe title="Pick a time to meet" src={calendlySrc} style={{ display: "block", width: "100%", minWidth: 280, height: 700, border: 0 }} />
                  </div>
                  {saving && <p className="fna-soft" style={{ textAlign: "center" }}>Saving your booking…</p>}
                  {saveError && (
                    <div style={{ textAlign: "center" }}>
                      <p className="fna-error">Your time was booked, but we couldn't save it. {saveError}</p>
                      <button type="button" className="fna-btn-secondary" onClick={confirmBooking} disabled={saving}>Try again</button>
                    </div>
                  )}
                  <div className="fna-actions">
                    <button type="button" className="fna-btn-secondary" onClick={() => go(3)}>← Back to questions</button>
                  </div>
                </section>
              )}

              {s.step === 5 && (
                <section className="fna-card fna-narrow fna-success">
                  <span className="fna-check">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#5552f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  </span>
                  <h2>Thank you, {s.client.name.split(" ")[0] || "there"}!</h2>
                  <p className="fna-soft">Your meeting is booked and your analysis is saved. You'll get a confirmation email with the details.</p>
                  <button type="button" className="fna-btn-secondary" onClick={resetForNext}>New client</button>
                  <span className="fna-muted fna-small">Resetting for the next guest…</span>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="fna-card fna-narrow" style={{ textAlign: "center", padding: "48px 24px" }}>
      <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }}>{title}</h2>
      <p className="fna-soft" style={{ margin: 0, fontSize: 15 }}>{children}</p>
    </div>
  );
}

const STYLES = `
  .fna-page { min-height: 100vh; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #12121c; box-sizing: border-box;
    background:
      radial-gradient(ellipse at top, rgba(255,255,255,.85), rgba(244,244,253,0) 60%),
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Crect x='10' y='10' width='70' height='70' rx='16' fill='%23ffffff' fill-opacity='.55'/%3E%3C/svg%3E"),
      #f4f4fd;
  }
  .fna-page *, .fna-page *::before, .fna-page *::after { box-sizing: border-box; }
  .fna-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 56px; background: rgba(255,255,255,.55); backdrop-filter: blur(10px); }
  .fna-logo { height: 32px; width: auto; display: block; }
  .fna-booth { font-size: 13px; font-weight: 600; color: #5b54f0; background: #fff; padding: 6px 12px; border-radius: 8px; box-shadow: 0 2px 10px rgba(85,82,240,.12); }
  .fna-main { max-width: 1100px; margin: 0 auto; padding: 48px 24px 96px; display: flex; flex-direction: column; gap: 40px; }
  .fna-hero { text-align: center; display: flex; flex-direction: column; gap: 16px; align-items: center; }
  .fna-hero h1 { margin: 0; font-size: clamp(36px, 6vw, 76px); line-height: 1.02; font-weight: 800; letter-spacing: -.045em; text-wrap: balance; }
  .fna-grad { background: linear-gradient(90deg, #6366f1, #a5a1ff); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .fna-lead { margin: 0; max-width: 640px; font-size: 19px; line-height: 1.6; color: #5b5f73; text-wrap: pretty; }
  .fna-meta { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; justify-content: center; font-size: 13px; color: #7b7f93; }
  .fna-link { border: 0; background: none; font: inherit; font-size: 13px; color: #6c63ff; cursor: pointer; font-weight: 600; padding: 0; }
  .fna-narrow { display: flex; flex-direction: column; gap: 20px; max-width: 640px; width: 100%; margin: 0 auto; }
  .fna-mid { max-width: 900px; width: 100%; margin: 0 auto; }
  .fna-head { text-align: center; }
  .fna-head h2 { margin: 0; font-size: 36px; font-weight: 700; letter-spacing: -.03em; }
  .fna-head p { margin: 8px 0 0; color: #5b5f73; font-size: 16px; }
  .fna-card { background: #fff; border-radius: 24px; padding: 28px; box-shadow: 0 14px 40px rgba(99,102,241,.08); display: flex; flex-direction: column; min-width: 0; }
  .fna-card h3 { margin: 0 0 8px; font-size: 20px; font-weight: 700; }
  .fna-card-list { padding: 8px 28px; }
  .fna-stack { display: flex; flex-direction: column; gap: 20px; }
  .fna-stack-lg { display: flex; flex-direction: column; gap: 24px; }
  .fna-label { display: flex; flex-direction: column; gap: 8px; font-size: 15px; font-weight: 600; }
  .fna-label-sm { display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 600; min-width: 0; }
  .fna-req { color: #e5484d; }
  .fna-input { width: 100%; height: 52px; border: 1px solid #e4e4f0; border-radius: 12px; padding: 0 16px; font: inherit; font-size: 16px; font-weight: 400; background: #fff; color: #12121c; }
  .fna-input::placeholder { color: #a3a6b8; }
  .fna-input:focus { outline: none; border-color: #8b85ff; box-shadow: 0 0 0 4px rgba(108,99,255,.12); }
  .fna-num-input { height: 48px; padding: 0 14px; font-size: 15px; text-align: right; }
  .fna-name-input { font-size: 20px; font-weight: 700; padding: 0 14px; }
  .fna-error { font-size: 14px; color: #e5484d; margin: 0; }
  .fna-muted { font-size: 14px; color: #7b7f93; }
  .fna-soft { color: #5b5f73; font-weight: 500; }
  .fna-small { font-size: 14px; }
  .fna-accent { color: #5b54f0; }
  .fna-page button:focus-visible { outline: 2px solid #6c63ff; outline-offset: 2px; }
  .fna-btn-primary { border: 0; cursor: pointer; font: inherit; font-size: 16px; font-weight: 700; color: #fff; padding: 15px 28px; border-radius: 14px; background: linear-gradient(90deg, #5b54f0, #8b85ff); box-shadow: 0 10px 24px rgba(99,102,241,.3); white-space: nowrap; }
  .fna-btn-primary:disabled, .fna-btn-secondary:disabled { opacity: .6; cursor: not-allowed; }
  .fna-success { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 14px; padding: 48px 24px; }
  .fna-success h2 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.02em; }
  .fna-success p { margin: 0; max-width: 420px; font-size: 15px; line-height: 1.55; }
  .fna-check { width: 52px; height: 52px; border-radius: 50%; background: #ecebff; display: flex; align-items: center; justify-content: center; }
  .fna-btn-secondary { cursor: pointer; font: inherit; font-size: 15px; font-weight: 600; color: #12121c; padding: 14px 24px; border-radius: 14px; background: #fff; border: 1px solid #e4e4f0; white-space: nowrap; }
  .fna-actions { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
  .fna-steps { display: flex; justify-content: center; }
  .fna-steps > div { display: flex; gap: 6px; padding: 6px; background: #fff; border-radius: 999px; box-shadow: 0 6px 20px rgba(99,102,241,.08); flex-wrap: wrap; justify-content: center; }
  .fna-steps button { border: 0; cursor: pointer; font: inherit; font-size: 14px; font-weight: 600; padding: 10px 18px; border-radius: 999px; display: flex; gap: 8px; align-items: center; white-space: nowrap; background: transparent; color: #5b5f73; }
  .fna-steps button span { opacity: .7; }
  .fna-steps button.on { background: linear-gradient(90deg, #5b54f0, #8b85ff); color: #fff; }
  .fna-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(340px, 100%), 1fr)); gap: 24px; align-items: start; }
  .fna-grid-2.wide { grid-template-columns: repeat(auto-fit, minmax(min(380px, 100%), 1fr)); }
  .fna-row { display: grid; grid-template-columns: minmax(0,1fr) 170px; gap: 14px; align-items: center; padding: 16px 0; border-bottom: 1px solid #eeeef6; }
  .fna-row.plain { padding: 10px 0; border-bottom: 0; }
  .fna-row-title { font-weight: 600; font-size: 15px; }
  .fna-row-note { font-size: 13px; color: #7b7f93; margin-top: 2px; }
  .fna-block { padding: 16px 0; border-bottom: 1px solid #eeeef6; display: flex; flex-direction: column; gap: 12px; }
  .fna-block.last { border-bottom: 0; }
  .fna-block-head { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
  .fna-amount { font-weight: 700; font-size: 18px; color: #5b54f0; white-space: nowrap; }
  .fna-sub { display: grid; gap: 10px; }
  .fna-total { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 16px 18px; background: #f4f4fd; border-radius: 14px; }
  .fna-total span { font-weight: 600; }
  .fna-total strong { font-weight: 800; font-size: 22px; letter-spacing: -.02em; }
  .fna-equation { display: grid; grid-template-columns: minmax(0,1fr) auto minmax(0,1fr) auto minmax(0,1.2fr); gap: 14px; align-items: center; }
  .fna-eq-box { padding: 16px 18px; border: 1px solid #e4e4f0; border-radius: 14px; min-width: 0; }
  .fna-eq-box div { font-size: 13px; color: #7b7f93; font-weight: 600; }
  .fna-eq-box strong { display: block; font-size: 24px; font-weight: 800; letter-spacing: -.02em; overflow-wrap: anywhere; }
  .fna-eq-box.hl { border: 0; background: linear-gradient(135deg, #5b54f0, #8b85ff); color: #fff; box-shadow: 0 10px 24px rgba(99,102,241,.25); }
  .fna-eq-box.hl div { color: #e4e2ff; }
  .fna-eq-box.hl strong { font-size: 28px; }
  .fna-op { font-size: 24px; font-weight: 700; color: #7b7f93; text-align: center; }
  .fna-bar { display: flex; height: 12px; border-radius: 999px; overflow: hidden; background: #e4e2ff; }
  .fna-bar div { background: linear-gradient(90deg, #5b54f0, #8b85ff); }
  .fna-kicker { font-size: 13px; font-weight: 600; color: #6c63ff; }
  .fna-between { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  .fna-pct { display: flex; align-items: center; gap: 8px; }
  .fna-pct input { width: 96px; height: 52px; font-size: 24px; font-weight: 800; }
  .fna-pct span { font-size: 24px; font-weight: 800; }
  .fna-fact { padding: 26px 30px; border-radius: 24px; background: linear-gradient(135deg, #5b54f0, #8b85ff); color: #fff; box-shadow: 0 14px 34px rgba(99,102,241,.3); }
  .fna-fact div { font-size: 13px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #e4e2ff; margin-bottom: 8px; }
  .fna-fact p { margin: 0; font-size: 22px; font-weight: 600; line-height: 1.4; letter-spacing: -.01em; text-wrap: pretty; }
  .fna-q { display: grid; grid-template-columns: 36px minmax(0,1fr) auto; gap: 16px; align-items: center; padding: 18px 0; border-bottom: 1px solid #eeeef6; }
  .fna-q.last { border-bottom: 0; }
  .fna-num { width: 32px; height: 32px; border-radius: 10px; background: #efeeff; color: #5b54f0; display: grid; place-items: center; font-weight: 700; font-size: 14px; }
  .fna-q-text { font-size: 16px; font-weight: 500; text-wrap: pretty; }
  .fna-yn { display: flex; gap: 8px; }
  .fna-toggle { cursor: pointer; font: inherit; font-size: 14px; font-weight: 600; min-width: 64px; padding: 10px 16px; border-radius: 12px; border: 1px solid #e4e4f0; background: #fff; color: #12121c; white-space: nowrap; }
  .fna-toggle.on { background: #5b54f0; color: #fff; border-color: #5b54f0; }
  @media (max-width: 720px) {
    .fna-header { padding: 14px 16px; }
    .fna-main { padding: 32px 16px 64px; gap: 28px; }
    .fna-card { padding: 20px; }
    .fna-card-list { padding: 4px 20px; }
    .fna-head h2 { font-size: 28px; }
    .fna-row { grid-template-columns: minmax(0,1fr) 130px; }
    .fna-equation { grid-template-columns: 1fr; gap: 8px; }
    .fna-q { grid-template-columns: 32px minmax(0,1fr); }
    .fna-q > .fna-yn { grid-column: 2; }
    .fna-fact p { font-size: 19px; }
  }
`;
