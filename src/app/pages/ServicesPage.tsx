import { ArrowRight, Briefcase, Shield, TrendingUp, Star, Heart } from "lucide-react";
import { Page, PillBtn, Label, SectionHeading, Card, CTABanner, inter } from "./shared";

export function ServicesPage({ navigate }: { navigate: (p: Page) => void }) {
  const services = [
    { icon: <Briefcase size={20} />, title: "Professional Careers", desc: "Start your own business with my guidance and the support of a proven system for success.", page: "professional-careers" as Page },
    { icon: <Shield size={20} />, title: "Estate Planning", desc: "Plan now for how you want your legacy to be handled and how you want your family to be taken care of.", page: "estate-planning" as Page },
    { icon: <TrendingUp size={20} />, title: "Retirement Planning", desc: "Secure your financial future with effective and personalized retirement planning strategies.", page: "retirement-planning" as Page },
    { icon: <Star size={20} />, title: "High Net Worth Estate Planning", desc: "Preserve and transfer your wealth seamlessly with ILIT strategies to minimize taxes.", page: "hnwi-estate-planning" as Page },
    { icon: <Heart size={20} />, title: "Life Insurance", desc: "Protect your loved ones with a plan that secures their future and provides peace of mind.", page: "life-insurance" as Page },
  ];

  const pillars = [
    { title: "Integrity", desc: "Honesty, transparency, and a client-first approach in every interaction." },
    { title: "Planning", desc: "Customized financial solutions built around your unique goals and situation." },
    { title: "Implementation", desc: "Clear communication, availability, and collaborative execution." },
  ];

  return (
    <div style={{ fontFamily: inter }}>
      <section className="relative pt-40 pb-24 px-6 bg-white overflow-hidden border-b border-[#e5e5e5]">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1600&h=800&fit=crop&auto=format" alt="" className="w-full h-full object-cover opacity-[0.05]" />
        </div>
        <div className="relative z-10 max-w-[1200px] mx-auto">
          <Label>What I Offer</Label>
          <SectionHeading className="mb-4">Your success is My Goal</SectionHeading>
          <p className="text-[#737373] text-[15px]">Giving you peace of mind, knowing you have it all planned out perfectly.</p>
        </div>
      </section>

      <section className="py-20 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
      </section>

      <section className="py-20 px-6 border-t border-[#e5e5e5] bg-[#fafafa]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <Label>My Approach</Label>
            <SectionHeading className="mb-3">Why Work With Me?</SectionHeading>
            <p className="text-[#737373] max-w-xl mx-auto text-[15px]">Dedicated to helping you build a comprehensive plan covering insurance, investments, and legacy-building.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pillars.map(p => (
              <Card key={p.title} className="text-center">
                <div className="w-10 h-10 rounded-full bg-[#0a0a0a] flex items-center justify-center text-white font-black text-sm mx-auto mb-4">
                  {p.title[0]}
                </div>
                <h3 className="text-base font-bold text-[#0a0a0a] mb-2">{p.title}</h3>
                <p className="text-sm text-[#737373] leading-relaxed">{p.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <CTABanner navigate={navigate} />
    </div>
  );
}
