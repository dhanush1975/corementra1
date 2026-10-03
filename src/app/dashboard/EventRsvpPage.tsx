import { useEffect, useState } from "react";
import { useParams } from "react-router";
import logo from "@/imports/logo/corementra-logo-trimmed.png";
import { client } from "./client";
import { NEEDS } from "./data";

type Status = "loading" | "notFound" | "loadError" | "form" | "schedule" | "submitting" | "done" | "error";

const CALENDLY_URL = "https://calendly.com/amit-arakeswara/amit-arakeswara-s-calendar";

const CALENDLY_ORIGIN = new URL(CALENDLY_URL).origin;

// Same rules the server enforces (amplify/functions/public-rsvp/handler.ts).
// Checked here first so nobody books a time and only then finds out their
// details were rejected.
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .,'’-]{0,79}$/u;
const PHONE_RE = /^[+(]?[0-9][0-9 ().-]{5,24}$/;
const NOTES_MAX = 1000;

// Calendly's scheduler is embedded as a plain cross-origin iframe rather
// than through their widget.js: that script would run on this origin, the
// same one the signed-in dashboard keeps its session on. embed_domain /
// embed_type are what tell Calendly it's embedded, which is what makes it
// post booking events back to this window.
function calendlyEmbedUrl(prefill: { name: string; email: string; phone: string }) {
  const url = new URL(CALENDLY_URL);
  url.searchParams.set("embed_domain", window.location.host);
  url.searchParams.set("embed_type", "Inline");
  url.searchParams.set("name", prefill.name);
  url.searchParams.set("email", prefill.email);
  // a1 maps to the event type's first custom question — the "anything that
  // will help prepare for our meeting" notes field — so the phone number
  // lands there instead of being lost.
  url.searchParams.set("a1", "Phone: " + prefill.phone);
  return url.toString();
}

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
  const [event, setEvent] = useState<{ id: string; name: string } | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState(NEEDS[0]);
  const [notes, setNotes] = useState("");

  const [formError, setFormError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [calendlySrc, setCalendlySrc] = useState("");

  useEffect(() => {
    if (!eventId) { setStatus("notFound"); return; }
    client.queries.getPublicEvent({ id: eventId }, { authMode: "apiKey" })
      .then(res => {
        if (res.data) { setEvent(res.data); setStatus("form"); return; }
        if (res.errors?.length) {
          // The query ran but was rejected (auth/permissions/etc) — this is
          // NOT "event doesn't exist". Details go to the console only.
          console.error("Event lookup errors:", res.errors);
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
        setStatus("loadError");
      });
  }, [eventId]);

  const resetForm = () => {
    setName(""); setEmail(""); setPhone(""); setInterest(NEEDS[0]); setNotes("");
    setStatus("form");
  };

  // Kiosk mode: auto-reset to a blank form for the next guest after a submission.
  useEffect(() => {
    if (status !== "done") return;
    const t = window.setTimeout(resetForm, 8000);
    return () => window.clearTimeout(t);
  }, [status]);

  // Details are only collected here — nothing is written to the database
  // until Calendly confirms an actual booking (see the message listener
  // below), so a visitor who fills the form but never picks a time never
  // becomes a lead.
  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().replace(/\s+/g, " ");
    if (!NAME_RE.test(cleanName)) { setFormError("Please enter your name using letters only (up to 80 characters)."); return; }
    if (!PHONE_RE.test(phone.trim())) { setFormError("Please enter a valid phone number, e.g. +1 555 000 0000."); return; }
    if (notes.trim().length > NOTES_MAX) { setFormError(`Please keep your message under ${NOTES_MAX} characters.`); return; }
    setFormError("");
    setSubmitError("");
    // Built once per visit to this step so the iframe isn't reloaded (and
    // an in-progress booking lost) by an unrelated re-render.
    setCalendlySrc(calendlyEmbedUrl({ name: cleanName, email: email.trim(), phone: phone.trim() }));
    setStatus("schedule");
  };

  // The server decides everything beyond these contact details (stage,
  // source, record type…) and re-validates each of them.
  const submitProspect = async () => {
    if (!eventId) return;
    setStatus("submitting");
    setSubmitError("");
    try {
      const res = await client.mutations.registerForEvent(
        { eventId, name, email, phone, interest, notes: notes.trim() },
        { authMode: "apiKey" },
      );
      if (res.errors?.length) {
        // Validation messages from the server are written for the visitor.
        setSubmitError(res.errors[0].message);
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  // The only trigger that actually creates the Prospect record: Calendly
  // posts this message to the parent window the moment a real time slot
  // is booked, not when the widget merely opens or a date is picked.
  useEffect(() => {
    if (status !== "schedule") return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin === CALENDLY_ORIGIN && e.data?.event === "calendly.event_scheduled") {
        submitProspect();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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

        <main className="erp-main" style={status === "schedule" || status === "submitting" || status === "error" ? { maxWidth: 900 } : undefined}>
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
              <p style={{ margin: 0, color: "#5a5c6e", fontSize: 15 }}>
                Something blocked the connection (not a bad link) — try disabling browser extensions or opening this in a private window.
              </p>
            </div>
          )}

          {status === "form" && (
            <>
              <div className="erp-hero">
                <span className="erp-pill">Meet CoreMentra{event ? ` at ${event.name}` : " at the Event"}</span>
                <h1>Tell Us About <span className="erp-grad">Your Goals</span></h1>
                <p className="erp-lead">Great to meet you here</p>
              </div>

              <form onSubmit={handleDetailsSubmit} className="erp-card">
                <div className="erp-field">
                  <label htmlFor="f-name">Full Name<span className="erp-req">*</span></label>
                  <input className="erp-input" id="f-name" required placeholder="e.g. Jane Doe" maxLength={80} value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="erp-field">
                  <label htmlFor="f-email">Email<span className="erp-req">*</span></label>
                  <input className="erp-input" id="f-email" type="email" required placeholder="e.g. jane.doe@company.com" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="erp-field">
                  <label htmlFor="f-phone">Phone Number<span className="erp-req">*</span></label>
                  <input className="erp-input" id="f-phone" type="tel" required placeholder="e.g. +1 555 000 0000" maxLength={25} value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="erp-field">
                  <label htmlFor="f-interest">Interested In</label>
                  <select className="erp-input" id="f-interest" value={interest} onChange={e => setInterest(e.target.value)}>
                    {NEEDS.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div className="erp-field">
                  <label htmlFor="f-notes">How can CoreMentra help you?</label>
                  <textarea className="erp-input" id="f-notes" rows={4} maxLength={NOTES_MAX} placeholder="Tell us about your goals, questions, or what you'd like to discuss after the event." value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
                {formError && <p style={{ color: "#e5484d", fontSize: 13, margin: 0 }}>{formError}</p>}
                <button type="submit" className="erp-btn-primary">
                  Continue to Scheduling
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7" /><path d="M7 7h10v10" /></svg>
                </button>
              </form>
            </>
          )}

          {(status === "schedule" || status === "submitting" || status === "error") && (
            <>
              <div className="erp-hero">
                <span className="erp-pill">Almost there, {firstName}</span>
                <h1>Pick a <span className="erp-grad">Time to Meet</span></h1>
                <p className="erp-lead">Your details are saved once you book a time below.</p>
              </div>

              <div className="erp-card" style={{ padding: 0, overflow: "hidden" }}>
                <iframe title="Pick a time to meet" src={calendlySrc} style={{ display: "block", width: "100%", minWidth: 280, height: 700, border: 0 }} />
                {status === "submitting" && (
                  <p style={{ fontSize: 13, color: "#5a5c6e", margin: 0, padding: "0 20px 20px", textAlign: "center" }}>Finalizing your registration…</p>
                )}
                {status === "error" && (
                  <div style={{ padding: "0 20px 20px", textAlign: "center" }}>
                    <p style={{ color: "#e5484d", fontSize: 13, margin: "0 0 10px" }}>Your time was booked, but we couldn't save your details. {submitError || "Please try again."}</p>
                    <button type="button" className="erp-btn-soft" onClick={submitProspect}>Try again</button>
                  </div>
                )}
              </div>
              <button type="button" className="erp-btn-soft" onClick={() => setStatus("form")}>← Edit my details</button>
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
