import { useEffect, useState, type ReactNode } from "react";
import { confirmSignIn, getCurrentUser, signIn } from "aws-amplify/auth";
import QRCode from "qrcode";
import { DBtn, DCard, DInput } from "./ui";

type Status = "checking" | "signedOut" | "totpSetup" | "totpConfirm" | "signedIn";
// Not exported from aws-amplify/auth's public entry point, so declared
// locally to match the shape `signIn()`'s nextStep actually returns.
type TotpSetupDetails = { sharedSecret: string; getSetupUri: (appName: string, accountName?: string) => URL };

export function AuthGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [totpDetails, setTotpDetails] = useState<TotpSetupDetails | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then(() => setStatus("signedIn"))
      .catch(() => setStatus("signedOut"));
  }, []);

  useEffect(() => {
    if (status !== "totpSetup" || !totpDetails) return;
    QRCode.toDataURL(totpDetails.getSetupUri("CoreMentra", email).toString())
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [status, totpDetails, email]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { isSignedIn, nextStep } = await signIn({ username: email, password });
      if (isSignedIn) { setStatus("signedIn"); return; }
      if (nextStep.signInStep === "CONTINUE_SIGN_IN_WITH_TOTP_SETUP") {
        setTotpDetails(nextStep.totpSetupDetails);
        setStatus("totpSetup");
      } else if (nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_TOTP_CODE") {
        setStatus("totpConfirm");
      } else {
        setError("Unsupported sign-in step: " + nextStep.signInStep);
      }
    } catch (err: any) {
      setError(err?.message || "Sign-in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { isSignedIn, nextStep } = await confirmSignIn({ challengeResponse: code });
      if (isSignedIn) setStatus("signedIn");
      else setError("Additional step required: " + nextStep.signInStep);
    } catch (err: any) {
      setError(err?.message || "Invalid code — try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "checking") return null;

  if (status === "signedOut") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]" style={{ fontFamily: "Inter, sans-serif" }}>
        <DCard className="w-full max-w-sm p-6">
          <div className="text-sm font-black text-[#0a0a0a] mb-0.5">CoreMentra</div>
          <div className="text-xs text-[#98a2b3] uppercase tracking-wider mb-5">Agent Dashboard</div>
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
            <DInput type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            <DInput type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            {error && <p className="text-xs text-[#a4372f]">{error}</p>}
            <DBtn type="submit" disabled={submitting} className="w-full mt-1">{submitting ? "Signing in…" : "Sign in"}</DBtn>
          </form>
        </DCard>
      </div>
    );
  }

  if (status === "totpSetup") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-5" style={{ fontFamily: "Inter, sans-serif" }}>
        <DCard className="w-full max-w-sm p-6">
          <div className="text-sm font-black text-[#0a0a0a] mb-0.5">Set up two-factor login</div>
          <p className="text-xs text-[#98a2b3] mb-4">Scan this with Google Authenticator, Authy, or 1Password — then enter the 6-digit code it shows.</p>
          {qrDataUrl && <img src={qrDataUrl} alt="MFA QR code" className="w-48 h-48 mx-auto mb-3 border border-[#e5e5e5] rounded-xl" />}
          {totpDetails && (
            <div className="mb-4">
              <div className="text-[11px] text-[#98a2b3] mb-1">Can't scan? Enter this key manually:</div>
              <div className="text-xs font-mono bg-[#f5f5f5] rounded-lg px-3 py-2 select-all break-all">{totpDetails.sharedSecret}</div>
            </div>
          )}
          <form onSubmit={handleCodeSubmit} className="flex flex-col gap-3">
            <DInput type="text" inputMode="numeric" placeholder="6-digit code" value={code} onChange={e => setCode(e.target.value)} required autoFocus />
            {error && <p className="text-xs text-[#a4372f]">{error}</p>}
            <DBtn type="submit" disabled={submitting} className="w-full mt-1">{submitting ? "Verifying…" : "Confirm & sign in"}</DBtn>
          </form>
        </DCard>
      </div>
    );
  }

  if (status === "totpConfirm") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-5" style={{ fontFamily: "Inter, sans-serif" }}>
        <DCard className="w-full max-w-sm p-6">
          <div className="text-sm font-black text-[#0a0a0a] mb-0.5">Enter your code</div>
          <p className="text-xs text-[#98a2b3] mb-4">Open your authenticator app and enter the current 6-digit code.</p>
          <form onSubmit={handleCodeSubmit} className="flex flex-col gap-3">
            <DInput type="text" inputMode="numeric" placeholder="6-digit code" value={code} onChange={e => setCode(e.target.value)} required autoFocus />
            {error && <p className="text-xs text-[#a4372f]">{error}</p>}
            <DBtn type="submit" disabled={submitting} className="w-full mt-1">{submitting ? "Verifying…" : "Sign in"}</DBtn>
          </form>
        </DCard>
      </div>
    );
  }

  return <>{children}</>;
}
