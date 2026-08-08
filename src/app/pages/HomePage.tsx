import { useEffect, useState } from "react";
import heroImage from "@/imports/Gemini_Generated_Image_jsh7lajsh7lajsh7.png";
import aboutPhoto from "@/imports/profile-photo/PHOTO-2026-07-28-17-17-14.jpg";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { ArrowRight, Briefcase, Shield, TrendingUp, Star, Heart, CheckCircle, X } from "lucide-react";
import { Page, PillBtn, Label, SectionHeading, Card, StatRow, CTABanner, CALENDLY_URL, inter } from "./shared";

function RateBadge() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (dismissed) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95 pointer-events-none"
      }`}
    >
      <div className="relative">
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-[#0a0a0a] border border-[#e5e5e5] flex items-center justify-center shadow-md hover:bg-neutral-100 transition-colors z-10"
        >
          <X size={12} />
        </button>
        <a
          href="https://agents.ethoslife.com/invite/efb422"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 bg-[#0a0a0a] text-white pl-4 pr-4 py-4 rounded-2xl shadow-2xl max-w-[280px] hover:bg-[#333] hover:scale-105 transition-all"
          style={{ fontFamily: inter }}
        >
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <Heart size={16} className="text-[#0070f3]" fill="currentColor" />
          </div>
          <div className="leading-snug">
            <div className="text-sm font-bold">Get Your Instant Insurance Quote in Under 10 Minutes!</div>
            <div className="text-xs text-[#a3a3a3] font-medium mt-1">Fast, free, and tailored to your needs.</div>
          </div>
          <ArrowRight size={14} className="shrink-0 mt-0.5" />
        </a>
      </div>
    </div>
  );
}

function HeroCard() {
  const tabs = ["Careers", "Estate", "Retirement", "HNWI", "Insurance"] as const;
  type Tab = typeof tabs[number];
  const [activeTab, setActiveTab] = useState<Tab>("Estate");

  const content: Record<
    Tab,
    { badge: string; title: string; desc: string; stats: { label: string; val: string }[] }
  > = {
    Careers: {
      badge: "Professional Careers",
      title: "Build Your Own Business",
      desc: "Start your own business with my guidance and the support of a proven system for success. Part-time or full-time flexibility with full training and mentorship.",
      stats: [
        { label: "Platform", val: "Proven system for success" },
        { label: "Commitment", val: "Part-time or full-time" },
      ],
    },
    Estate: {
      badge: "Estate Planning",
      title: "Plan Your Legacy Today",
      desc: "Plan now for how you want your legacy to be handled and how you want your family to be taken care of — wills, trusts, and probate avoidance.",
      stats: [
        { label: "68% of adults", val: "have no will or trust" },
        { label: "1 in 6", val: "face a will or trust contest" },
      ],
    },
    Retirement: {
      badge: "Retirement Planning",
      title: "Personalized Retirement Strategy",
      desc: "Secure your financial future with effective and personalized retirement planning strategies tailored to your unique needs — with 100% principal protection.",
      stats: [
        { label: "~55% of retirees", val: "rely on Social Security alone" },
        { label: "$300K+", val: "avg. healthcare cost in retirement" },
      ],
    },
    HNWI: {
      badge: "HNWI Estate Planning",
      title: "Preserve & Transfer Wealth",
      desc: "Preserve and transfer your wealth seamlessly with estate planning strategies, including ILITs, to minimize taxes and protect your assets from creditors.",
      stats: [
        { label: "Strategy", val: "ILIT for estate tax reduction" },
        { label: "Goal", val: "Minimize taxes, avoid probate" },
      ],
    },
    Insurance: {
      badge: "Life Insurance",
      title: "Protect Your Loved Ones",
      desc: "Protect your loved ones with a plan that secures their future and provides peace of mind — Term with living benefits or Indexed Universal Life (IUL).",
      stats: [
        { label: "64% of Americans 58+", val: "die without life insurance" },
        { label: "IUL floor", val: "0% — never a negative return" },
      ],
    },
  };

  const current = content[activeTab];

  return (
    <div
      className="w-full lg:w-[380px] xl:w-[420px] shrink-0 bg-white rounded-3xl shadow-2xl overflow-hidden"
      style={{ fontFamily: inter }}
    >
      <div className="px-6 pt-6 pb-4 border-b border-[#f0f0f0]">
        <p className="text-[15px] font-black text-[#0a0a0a] tracking-[-0.01em]">Start Your Financial Plan</p>
      </div>

      <div className="flex border-b border-[#f0f0f0]">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[11px] font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "text-[#0a0a0a] border-[#0a0a0a]"
                : "text-[#a3a3a3] border-transparent hover:text-[#737373]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="px-6 py-5">
        <div className="mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#a3a3a3] bg-[#f5f5f5] px-2.5 py-1 rounded-full">
            {current.badge}
          </span>
        </div>

        <p className="text-base font-black text-[#0a0a0a] tracking-[-0.02em] mb-2 leading-snug">
          {current.title}
        </p>
        <p className="text-[13px] text-[#737373] leading-relaxed mb-5">
          {current.desc}
        </p>

        <div className="space-y-2 mb-6">
          {current.stats.map(s => (
            <div key={s.label} className="flex items-center justify-between bg-[#f5f5f5] rounded-xl px-4 py-3">
              <span className="text-[13px] text-[#737373]">{s.label}</span>
              <span className="text-[13px] font-bold text-[#0a0a0a] text-right max-w-[55%]">{s.val}</span>
            </div>
          ))}
        </div>

        <a
          href={CALENDLY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-[#0a0a0a] text-white text-[15px] font-semibold py-3.5 rounded-full hover:bg-[#333] transition-colors"
        >
          Schedule a Meeting
        </a>
      </div>
    </div>
  );
}

export function HomePage({ navigate }: { navigate: (p: Page) => void }) {
  const services = [
    { icon: <Briefcase size={20} />, title: "Professional Careers", desc: "Start your own business with my guidance and the support of a proven system for success.", page: "professional-careers" as Page },
    { icon: <Shield size={20} />, title: "Estate Planning", desc: "Plan now for how you want your legacy to be handled and how you want your family to be taken care of.", page: "estate-planning" as Page },
    { icon: <TrendingUp size={20} />, title: "Retirement Planning", desc: "Secure your financial future with effective and personalized retirement planning strategies.", page: "retirement-planning" as Page },
    { icon: <Star size={20} />, title: "High Net Worth Estate Planning", desc: "Preserve and transfer your wealth seamlessly with ILIT strategies to minimize taxes.", page: "hnwi-estate-planning" as Page },
    { icon: <Heart size={20} />, title: "Life Insurance", desc: "Protect your loved ones with a plan that secures their future and provides peace of mind.", page: "life-insurance" as Page },
  ];

  const steps = [
    { num: "01", title: "Discovery", desc: "Getting to know you, your financial situation, goals, and challenges. Understanding your aspirations and future vision." },
    { num: "02", title: "Planning", desc: "Developing a comprehensive financial strategy covering retirement, long-term care, and legacy transfer." },
    { num: "03", title: "Implementation", desc: "Executing strategies and navigating available financial products, ensuring alignment with long-term goals." },
    { num: "04", title: "Review", desc: "A living, evolving strategy with regular check-ins to monitor progress as your life changes." },
  ];

  return (
    <div style={{ fontFamily: inter }}>
      <RateBadge />

      <section className="relative min-h-screen flex items-center overflow-hidden">
        <ImageWithFallback
          src={heroImage}
          alt="Financial consultation — two people meeting at a table in a serene landscape"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-8 w-full pt-24 pb-16 flex flex-col lg:flex-row items-center lg:items-center gap-12 lg:gap-16">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-base font-semibold text-white/80 uppercase tracking-[0.12em]">
                CoreMentra — Your Wealth. Our Mentra.
              </span>
            </div>
            <h1 className="text-7xl md:text-8xl xl:text-[108px] font-black text-white leading-[1.02] tracking-[-0.04em] mb-8">
              Own Your<br />Future.
            </h1>
            <button
              onClick={() => navigate("services")}
              className="inline-flex items-center gap-2 bg-transparent border border-white text-white font-semibold text-sm px-7 py-3.5 rounded-full hover:bg-white/10 transition-colors"
              style={{ fontFamily: inter }}
            >
              View Services
            </button>
          </div>

          <HeroCard />
        </div>
      </section>

      <StatRow
        stats={[
          { num: "66%", label: "US adults fail basic financial literacy" },
          { num: "50%", label: "Families lack income protection" },
          { num: "68%", label: "Adults have no will or trust" },
          { num: "48%", label: "Adults have no retirement plan" },
        ]}
      />

      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <Label>What I Offer</Label>
              <SectionHeading>Services</SectionHeading>
            </div>
            <PillBtn variant="ghost" onClick={() => navigate("services")}>All Services <ArrowRight size={14} /></PillBtn>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(s => (
              <Card key={s.title} className="cursor-pointer group">
                <button className="w-full text-left" onClick={() => navigate(s.page)}>
                  <div className="w-10 h-10 rounded-xl bg-[#efefef] flex items-center justify-center text-[#737373] mb-5 group-hover:bg-[#0a0a0a] group-hover:text-white transition-all">
                    {s.icon}
                  </div>
                  <h3 className="text-base font-bold text-[#0a0a0a] mb-2 tracking-[-0.01em]">{s.title}</h3>
                  <p className="text-sm text-[#737373] leading-relaxed mb-5">{s.desc}</p>
                  <span className="text-xs text-[#a3a3a3] flex items-center gap-1 group-hover:text-[#0070f3] transition-colors font-semibold uppercase tracking-[0.08em]">
                    Read More <ArrowRight size={12} />
                  </span>
                </button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 border-t border-[#e5e5e5] bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="bg-[#fafafa] border border-[#e5e5e5] rounded-3xl p-10 md:p-14 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 lg:items-center">
            <div>
              <Label>Life Insurance</Label>
              <h2 className="text-3xl md:text-4xl font-black text-[#0a0a0a] tracking-[-0.02em] mb-8">Protect Your Family with Confidence</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                {[
                  { title: "Up to $2M Coverage", desc: "No medical exam for eligible applicants.*" },
                  { title: "Quick & Easy", desc: "Answer a few simple health questions." },
                  { title: "Free Will & Estate Plan", desc: "Included with eligible products.*" },
                  { title: "Flexible Options", desc: "Coverage to fit your budget and goals." },
                ].map(f => (
                  <div key={f.title} className="flex items-start gap-3">
                    <CheckCircle size={16} className="text-[#0070f3] shrink-0 mt-1" />
                    <p className="text-sm text-[#737373] leading-relaxed">
                      <span className="text-[#0a0a0a] font-semibold">{f.title}</span> — {f.desc}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#a3a3a3] leading-relaxed">*Eligibility, product availability, and state restrictions apply.</p>
            </div>
            <PillBtn href="https://agents.ethoslife.com/invite/efb422" className="shrink-0 whitespace-nowrap">
              Get Your Rates <ArrowRight size={14} />
            </PillBtn>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 border-t border-[#e5e5e5] bg-[#fafafa]">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <img
              src={aboutPhoto}
              alt="Amit Arakeswara, Financial Strategist"
              className="rounded-2xl w-full object-cover"
            />
          </div>
          <div>
            <Label>About Me</Label>
            <SectionHeading className="text-4xl mb-6">Delivering Wealth, Pride, and Peace of Mind</SectionHeading>
            <p className="text-[#737373] leading-relaxed mb-6 text-[15px]">
              As a financial professional built on trust and integrity, I help individuals create wealth, feel proud of their financial decisions, and gain the peace of mind that comes from knowing they have a solid plan.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "Educate you about your financial options",
                "Empower you to create, grow, and protect your wealth",
                "Help you build a legacy for the future",
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-[15px]">
                  <CheckCircle size={16} className="text-[#0070f3] mt-1 shrink-0" />
                  <span className="text-[#525252]">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-[#a3a3a3] text-sm mb-1">Every financial journey is unique.</p>
            <p className="text-[#a3a3a3] text-sm mb-8">Are you ready to take control of your financial future? Schedule your free consultation today.</p>
            <div className="mb-1 font-bold text-[#0a0a0a] text-sm">Amit Arakeswara</div>
            <div className="text-xs text-[#a3a3a3] uppercase tracking-[0.1em] mb-6">Financial Strategist</div>
            <PillBtn href={CALENDLY_URL}>Schedule a Meeting <ArrowRight size={14} /></PillBtn>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 border-t border-[#e5e5e5] bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <Label>How It Works</Label>
            <SectionHeading className="mb-3">My Financial Strategy Process</SectionHeading>
            <p className="text-[#737373] max-w-lg mx-auto text-[15px]">My process creates a personalized financial plan tailored to your goals.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map(step => (
              <Card key={step.title}>
                <div className="text-5xl font-black text-[#e5e5e5] mb-4 tracking-[-0.04em] leading-none select-none">{step.num}</div>
                <h3 className="text-base font-bold text-[#0a0a0a] mb-2 tracking-[-0.01em]">{step.title}</h3>
                <p className="text-sm text-[#737373] leading-relaxed">{step.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <CTABanner navigate={navigate} />
    </div>
  );
}
