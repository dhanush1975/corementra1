import { ArrowRight, CheckCircle } from "lucide-react";

export type Page =
  | "home"
  | "who-am-i"
  | "faq"
  | "services"
  | "professional-careers"
  | "estate-planning"
  | "retirement-planning"
  | "hnwi-estate-planning"
  | "life-insurance"
  | "contact";

export const inter = "Inter, sans-serif";

export const CALENDLY_URL = "https://calendly.com/amit-arakeswara/amit-arakeswara-s-calendar";

export function PillBtn({
  onClick,
  href,
  variant = "primary",
  children,
  className = "",
}: {
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "ghost";
  children: React.ReactNode;
  className?: string;
}) {
  const base = "inline-flex items-center gap-2 rounded-full font-semibold text-sm tracking-wide transition-all duration-200 cursor-pointer";
  const styles = {
    primary: "bg-[#0a0a0a] text-white hover:bg-[#333] px-6 py-3",
    ghost: "border border-[#d4d4d4] text-[#0a0a0a] hover:border-[#0a0a0a] px-6 py-3",
  };

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`${base} ${styles[variant]} ${className}`} style={{ fontFamily: inter }}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={`${base} ${styles[variant]} ${className}`} style={{ fontFamily: inter }}>
      {children}
    </button>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#a3a3a3] mb-3" style={{ fontFamily: inter }}>
      {children}
    </p>
  );
}

export function SectionHeading({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`text-4xl md:text-5xl font-black text-[#0a0a0a] leading-[1.08] tracking-[-0.03em] ${className}`} style={{ fontFamily: inter }}>
      {children}
    </h2>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#f5f5f5] border border-[#e5e5e5] rounded-2xl p-6 transition-all duration-200 hover:border-[#d4d4d4] hover:shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function NavLink({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-3 py-2 rounded-lg text-sm transition-colors ${active ? "text-[#0a0a0a] font-semibold" : "text-[#737373] hover:text-[#0a0a0a]"}`} style={{ fontFamily: inter }}>
      {children}
    </button>
  );
}

export function StatRow({ stats }: { stats: { num: string; label: string }[] }) {
  return (
    <div className="border-t border-b border-[#e5e5e5] py-10 px-6 bg-white" style={{ fontFamily: inter }}>
      <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-[#e5e5e5]">
        {stats.map((s, i) => (
          <div key={i} className="px-8 first:pl-0 last:pr-0 text-center md:text-left">
            <div className="text-3xl md:text-4xl font-black text-[#0a0a0a] tracking-[-0.04em]">{s.num}</div>
            <div className="text-xs text-[#a3a3a3] mt-1 leading-relaxed">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CTABanner({ navigate }: { navigate: (p: Page) => void }) {
  return (
    <section className="border-t border-[#e5e5e5] py-24 px-6 bg-white" style={{ fontFamily: inter }}>
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <SectionHeading className="text-3xl md:text-4xl">Ready to start?</SectionHeading>
          <p className="text-[#737373] mt-3 text-base max-w-lg">
            There is no better time to start than now. Take control of your future — schedule your free consultation today.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <PillBtn href={CALENDLY_URL}>Schedule a Meeting <ArrowRight size={14} /></PillBtn>
          <PillBtn variant="ghost" onClick={() => navigate("services")}>View Services</PillBtn>
        </div>
      </div>
    </section>
  );
}
