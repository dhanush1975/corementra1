import { useEffect, useState } from "react";
import { useParams } from "react-router";
import logo from "@/imports/logo/corementra-logo-trimmed.png";
import { client } from "./client";
import { today, uid } from "./data";
import type { EventRecord } from "./types";

type Status = "loading" | "notFound" | "loadError" | "form" | "submitting" | "done" | "error";

const INTERESTS = ["Wealth management", "Investment advisory", "Business financing", "Tax & planning", "Something else"];

const STYLES = `
  .erp-page { min-height: 100vh; display: flex; flex-direction: column; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #15151f;
    background:
      radial-gradient(ellipse 80% 50% at 50% 0%, #e3e5ff 0%, rgba(227,229,255,0) 70%),
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Crect x='6' y='6' width='44' height='44' rx='12' fill='%23ffffff' fill-opacity='0.35'/%3E%3C/svg%3E"),
      linear-gradient(180deg, #f4f5ff 0%, #e9ebfb 100%);
  }
  .erp-page a { color: #5552f0; text-decoration: none; }
  .erp-page a:hover { color: #3d3ad4; }
  .erp-header { display: flex; align-items: center; padding: 14px 56px; background: rgba(255,255,255,.55); backdrop-filter: blur(10px); }
  .erp-brand { display: flex; align-items: center; gap: 10px; color: #15151f; font-weight: 700; font-size: 20px; letter-spacing: -0.02em; }
  .erp-brand:hover { color: #15151f; }
  .erp-logo { height: 32px; width: auto; display: block; }
  .erp-main { flex: 1; width: 100%; max-width: 640px; margin: 0 auto; padding: 64px 20px 80px; display: flex; flex-direction: column; align-items: center; gap: 40px; box-sizing: border-box; }
  .erp-hero { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 18px; }
  .erp-pill { background: #fff; color: #5552f0; font-size: 14px; font-weight: 500; padding: 8px 14px; border-radius: 8px; box-shadow: 0 2px 10px rgba(85,82,240,.12); }
  .erp-hero h1 { margin: 0; font-size: clamp(38px, 6.5vw, 58px); line-height: 1.05; font-weight: 700; letter-spacing: -0.035em; }
  .erp-grad { background: linear-gradient(90deg, #6c6af8, #9c9bff); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .erp-lead { margin: 0; max-width: 560px; font-size: 18px; line-height: 1.55; color: #5a5c6e; }
  .erp-card { box-sizing: border-box; width: 100%; background: #fff; border-radius: 18px; padding: 24px 20px; box-shadow: 0 10px 40px rgba(60,60,140,.08); display: flex; flex-direction: column; gap: 20px; }
  .erp-field { display: flex; flex-direction: column; gap: 8px; }
  .erp-field label { font-size: 13px; font-weight: 600; }
  .erp-req { color: #e5484d; }
  .erp-input { font: inherit; font-size: 14px; color: #15151f; background-color: #fff; padding: 12px 14px; border: 1px solid #e6e7ef; border-radius: 12px; box-shadow: 0 1px 2px rgba(20,20,40,.04); width: 100%; box-sizing: border-box; }
  .erp-input::placeholder { color: #a3a6b8; }
  .erp-input:focus { outline: none; border-color: #8b89f7; box-shadow: 0 0 0 3px rgba(98,95,245,.15); }
  textarea.erp-input { resize: vertical; font-family: inherit; }
  select.erp-input {
    appearance: none; padding-right: 40px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2315151f' stroke-width='1.75'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 14px center;
  }
  .erp-btn-primary { font: inherit; font-size: 15px; font-weight: 500; color: #fff; background: linear-gradient(180deg, #6d6afa, #5552f0); border: 0; border-radius: 14px; padding: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 8px 20px rgba(85,82,240,.3); }
  .erp-btn-primary:hover { filter: brightness(1.06); }
  .erp-btn-primary:active { transform: translateY(1px); }
  .erp-btn-primary:disabled { opacity: .6; cursor: not-allowed; }
  .erp-btn-soft { font: inherit; font-size: 14px; font-weight: 500; color: #5552f0; background: #f1f0ff; border: 0; border-radius: 10px; padding: 10px 18px; cursor: pointer; margin-top: 6px; }
  .erp-btn-soft:hover { background: #e6e5ff; }
  .erp-success { padding: 48px 24px; align-items: center; text-align: center; gap: 14px; }
  .erp-check { width: 52px; height: 52px; border-radius: 50%; background: #ecebff; display: flex; align-items: center; justify-content: center; }
  .erp-success h2 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.02em; }
  .erp-success p { margin: 0; max-width: 420px; font-size: 15px; line-height: 1.55; color: #5a5c6e; }
  .erp-muted { font-size: 12px; color: #9a9cad; }
  @media (max-width: 600px) { .erp-header { padding: 14px 20px; } .erp-main { padding-top: 40px; } }
`;

export function EventRsvpPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [status, setStatus] = useState<Status>("loading");
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState(INTERESTS[0]);
  const [notes, setNotes] = useState("");

  const [loadErrorDetail, setLoadErrorDetail] = useState("");

  useEffect(() => {
    if (!eventId) { setStatus("notFound"); return; }
    client.models.Event.get({ id: eventId }, { authMode: "apiKey" })
      .then(res => {
        if (res.data) { setEvent(res.data as unknown as EventRecord); setStatus("form"); return; }
        if (res.errors?.length) {
          // The query ran but was rejected (auth/permissions/etc) — this is
          // NOT "event doesn't exist", show the real reason.
          console.error("Event lookup errors:", res.errors);
          setLoadErrorDetail(res.errors.map(e => e.message).join("; "));
          setStatus("loadError");
          return;
        }
        // Query succeeded, genuinely no such record.
        setStatus("notFound");
      })
      .catch(err => {
        // Never reached AppSync at all — network/credentials/CORS failure,
        // not a "this event doesn't exist" situation.
        console.error("Event lookup failed:", err);
        setLoadErrorDetail(err?.message || String(err));
        setStatus("loadError");
      });
  }, [eventId]);

  const resetForm = () => {
    setName(""); setEmail(""); setPhone(""); setInterest(INTERESTS[0]); setNotes("");
    setStatus("form");
  };

  // Kiosk mode: auto-reset to a blank form for the next guest after a submission.
  useEffect(() => {
    if (status !== "done") return;
    const t = window.setTimeout(resetForm, 8000);
    return () => window.clearTimeout(t);
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;
    setStatus("submitting");
    try {
      const res = await client.models.Prospect.create(
        {
          id: uid(),
          name,
          email,
          phone,
          eventId,
          source: "Event / Workshop",
          need: interest,
          agent: "",
          stage: "NEW",
          plan: "Not decided yet",
          lastContact: today(),
          notes: notes.trim() || "Submitted via event registration link.",
          kind: "Prospect",
        },
        { authMode: "apiKey" },
      );
      if (res.errors?.length) { setStatus("error"); return; }
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  const firstName = name.trim().split(" ")[0] || "there";

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');" + STYLES}</style>
      <div className="erp-page">
        <header className="erp-header">
          <a className="erp-brand" href="/">
            <img src={logo} alt="CoreMentra" className="erp-logo" />
          </a>
        </header>

        <main className="erp-main">
          {status === "loading" && <p>Loading…</p>}

          {status === "notFound" && (
            <div className="erp-card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }}>Link not valid</h2>
              <p style={{ margin: 0, color: "#5a5c6e", fontSize: 15 }}>This registration link isn't valid or the event no longer exists.</p>
            </div>
          )}

          {status === "loadError" && (
            <div className="erp-card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }}>Couldn't load this page</h2>
              <p style={{ margin: "0 0 12px", color: "#5a5c6e", fontSize: 15 }}>
                Something blocked the connection (not a bad link) — try disabling browser extensions or opening this in a private window.
              </p>
              <p style={{ margin: 0, color: "#9a9cad", fontSize: 12, fontFamily: "monospace", wordBreak: "break-word" }}>{loadErrorDetail}</p>
            </div>
          )}

          {(status === "form" || status === "submitting" || status === "error") && (
            <>
              <div className="erp-hero">
                <span className="erp-pill">Meet CoreMentra{event ? ` at ${event.name}` : " at the Event"}</span>
                <h1>Tell Us About <span className="erp-grad">Your Goals</span></h1>
                <p className="erp-lead">Great to meet you here</p>
              </div>

              <form onSubmit={handleSubmit} className="erp-card">
                <div className="erp-field">
                  <label htmlFor="f-name">Full Name<span className="erp-req">*</span></label>
                  <input className="erp-input" id="f-name" required placeholder="e.g. Jane Doe" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="erp-field">
                  <label htmlFor="f-email">Email<span className="erp-req">*</span></label>
                  <input className="erp-input" id="f-email" type="email" required placeholder="e.g. jane.doe@company.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="erp-field">
                  <label htmlFor="f-phone">Phone Number</label>
                  <input className="erp-input" id="f-phone" type="tel" placeholder="e.g. +1 555 000 0000" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="erp-field">
                  <label htmlFor="f-interest">Interested In</label>
                  <select className="erp-input" id="f-interest" value={interest} onChange={e => setInterest(e.target.value)}>
                    {INTERESTS.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div className="erp-field">
                  <label htmlFor="f-notes">How can CoreMentra help you?</label>
                  <textarea className="erp-input" id="f-notes" rows={4} placeholder="Tell us about your goals, questions, or what you'd like to discuss after the event." value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
                {status === "error" && <p style={{ color: "#e5484d", fontSize: 13, margin: 0 }}>Something went wrong — please try again.</p>}
                <button type="submit" className="erp-btn-primary" disabled={status === "submitting"}>
                  {status === "submitting" ? "Submitting…" : "Submit Details"}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7" /><path d="M7 7h10v10" /></svg>
                </button>
              </form>
            </>
          )}

          {status === "done" && (
            <div className="erp-card erp-success">
              <span className="erp-check">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#5552f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              </span>
              <h2>Thank you, {firstName}!</h2>
              <p>We've received your details. Our team will reach out within 1 business day.</p>
              <button type="button" className="erp-btn-soft" onClick={resetForm}>New entry</button>
              <span className="erp-muted">Resetting for the next guest…</span>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
