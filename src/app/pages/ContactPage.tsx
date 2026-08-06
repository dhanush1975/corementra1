import { useState } from "react";
import { CheckCircle, Phone, Mail, MapPin, Facebook, Linkedin, Instagram } from "lucide-react";
import { Page, PillBtn, Label, SectionHeading, CTABanner, inter } from "./shared";

const CONTACT_EMAIL = "contact@corementra.com";
const CONTACT_PHONE = "+1 (213) 308-4003";
const CONTACT_PHONE_TEL = "+12133084003";

export function ContactPage() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `Website inquiry from ${form.firstName} ${form.lastName}`.trim();
    const body = [
      `Name: ${form.firstName} ${form.lastName}`.trim(),
      `Email: ${form.email}`,
      form.phone && `Phone: ${form.phone}`,
      "",
      form.message,
    ].filter(Boolean).join("\n");
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  };

  return (
    <div style={{ fontFamily: inter }}>
      <section className="pt-40 pb-20 px-6 bg-white border-b border-[#e5e5e5]">
        <div className="max-w-[1200px] mx-auto">
          <Label>Get In Touch</Label>
          <SectionHeading>Contact Us</SectionHeading>
          <p className="text-[#737373] mt-3 text-[15px]">We are here for questions or consulting.</p>
        </div>
      </section>

      <section className="py-16 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <div className="w-14 h-14 rounded-full bg-[#0a0a0a] flex items-center justify-center mb-6">
                  <CheckCircle size={28} className="text-white" />
                </div>
                <h3 className="text-2xl font-black text-[#0a0a0a] tracking-[-0.02em] mb-3">Almost There!</h3>
                <p className="text-[#737373] text-[15px]">Your email app should now be open with your message ready to send. If it didn't open, email us directly at{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#0070f3] font-semibold">{CONTACT_EMAIL}</a>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-2xl font-black text-[#0a0a0a] tracking-[-0.02em] mb-6">Send a Message</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[{ label: "First name *", key: "firstName", type: "text", req: true }, { label: "Last name *", key: "lastName", type: "text", req: true }].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-[#a3a3a3] uppercase tracking-[0.08em] mb-2">{f.label}</label>
                      <input type={f.type} required={f.req} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl px-4 py-3 text-[#0a0a0a] text-sm placeholder-[#d4d4d4] focus:outline-none focus:border-[#a3a3a3] transition" />
                    </div>
                  ))}
                </div>
                {[{ label: "Email *", key: "email", type: "email", req: true }, { label: "Phone", key: "phone", type: "tel", req: false }].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-[#a3a3a3] uppercase tracking-[0.08em] mb-2">{f.label}</label>
                    <input type={f.type} required={f.req} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl px-4 py-3 text-[#0a0a0a] text-sm placeholder-[#d4d4d4] focus:outline-none focus:border-[#a3a3a3] transition" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-[#a3a3a3] uppercase tracking-[0.08em] mb-2">Message</label>
                  <textarea rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Leave us a message..." className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl px-4 py-3 text-[#0a0a0a] text-sm placeholder-[#d4d4d4] focus:outline-none focus:border-[#a3a3a3] transition resize-none" />
                </div>
                <PillBtn className="w-full justify-center py-4">Submit</PillBtn>
              </form>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-black text-[#0a0a0a] tracking-[-0.02em] mb-4">Let's Connect</h2>
            <p className="text-[#737373] text-[15px] leading-relaxed mb-8">Whether you have a question, want to explore your options, or are ready to start your financial journey — I am here to help.</p>
            <div className="space-y-3 mb-10">
              {[
                { icon: <Phone size={16} />, label: "Phone", val: CONTACT_PHONE, href: `tel:${CONTACT_PHONE_TEL}` },
                { icon: <Mail size={16} />, label: "Email", val: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
                { icon: <MapPin size={16} />, label: "Location", val: "Serving clients across North America", href: undefined },
              ].map(c => {
                const content = (
                  <>
                    <div className="w-9 h-9 rounded-full bg-[#efefef] border border-[#e5e5e5] flex items-center justify-center text-[#a3a3a3] shrink-0">{c.icon}</div>
                    <div>
                      <div className="text-[10px] font-semibold text-[#a3a3a3] uppercase tracking-[0.1em] mb-0.5">{c.label}</div>
                      <div className="text-[#525252] text-sm">{c.val}</div>
                    </div>
                  </>
                );
                return c.href ? (
                  <a key={c.label} href={c.href} className="flex items-center gap-4 p-4 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl hover:border-[#d4d4d4] hover:bg-[#efefef] transition-colors">
                    {content}
                  </a>
                ) : (
                  <div key={c.label} className="flex items-center gap-4 p-4 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl">
                    {content}
                  </div>
                );
              })}
            </div>
            <div>
              <div className="text-[10px] font-semibold text-[#a3a3a3] uppercase tracking-[0.1em] mb-4">Follow Me</div>
              <div className="flex gap-3">
                {[
                  <svg key="tiktok" viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.83 1.55V6.79a4.85 4.85 0 0 1-1.06-.1z"/></svg>,
                  <Linkedin key="li" size={16} />,
                  <Facebook key="fb" size={16} />,
                  <Instagram key="ig" size={16} />,
                ].map((icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-full border border-[#e5e5e5] flex items-center justify-center text-[#a3a3a3] hover:text-[#0a0a0a] hover:border-[#d4d4d4] transition-all">{icon}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
