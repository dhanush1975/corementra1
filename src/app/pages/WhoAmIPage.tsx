import { CheckCircle } from "lucide-react";
import whoAmIPhoto from "@/imports/profile-photo/2.JPG";
import { Page, PillBtn, Label, SectionHeading, StatRow, CTABanner, inter } from "./shared";

export function WhoAmIPage({ navigate }: { navigate: (p: Page) => void }) {
  const focus = [
    "Estate Planning (wills/trusts)",
    "Life Insurance with Living Benefits",
    "Tax-Advantaged Strategies",
    "Wealth Education for Heirs",
    "Defining Your Family Mission",
  ];

  return (
    <div style={{ fontFamily: inter }}>
      <section className="relative pt-40 pb-24 px-6 bg-white overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=1600&h=800&fit=crop&auto=format" alt="" className="w-full h-full object-cover opacity-[0.05]" />
        </div>
        <div className="relative z-10 max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-14 items-center">
          <div>
            <Label>We practice what we preach</Label>
            <h1 className="text-6xl md:text-7xl font-black text-[#0a0a0a] leading-[1.0] tracking-[-0.04em] mb-6">Amit Arakeswara</h1>
            <div className="border-l-2 border-[#0070f3] pl-5 mb-6">
              <p className="text-[#0a0a0a] text-lg md:text-xl font-bold leading-snug mb-2">
                Founder, CoreMentra
              </p>
              <p className="text-[#525252] text-base md:text-lg font-medium leading-relaxed">
                Helping families build wealth, legacy, and time freedom — and empowering professionals beyond the 9–5. On a mission to help 1 million families become financially independent.
              </p>
            </div>
            <p className="text-[#a3a3a3] text-sm font-medium tracking-[0.12em] uppercase">Make Money · Save Money · Grow Money · Protect Money</p>
          </div>
          <div className="relative">
            <img src={whoAmIPhoto} alt="Amit Arakeswara, Founder of CoreMentra" className="rounded-2xl w-full object-cover aspect-[4/5] shadow-xl" />
          </div>
        </div>
      </section>

      <StatRow
        stats={[
          { num: "66%", label: "US adults cannot pass a basic financial literacy test" },
          { num: "50%", label: "US families do not have proper income protection" },
          { num: "68%", label: "US adults do not have a will or trust" },
          { num: "48%", label: "US adults have no retirement savings plan" },
        ]}
      />

      <section className="py-24 px-6 border-t border-[#e5e5e5] bg-white">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <Label>My Mission</Label>
            <SectionHeading className="text-4xl mb-6">More Than Just a Financial Advisor</SectionHeading>
            <p className="text-[#737373] leading-relaxed mb-6 text-[15px]">
              I aim to lead a financial revolution in North America. I believe the biggest barrier to financial success is not a lack of opportunity — it is limited financial literacy and awareness.
            </p>
            <p className="text-[#737373] leading-relaxed mb-8 text-[15px]">
              My mission is to bridge that gap by educating families and individuals about the tools and strategies that were once reserved for the wealthy, making them accessible to everyone who wants to build a lasting legacy.
            </p>
            <PillBtn onClick={() => navigate("contact")}>Work With Me <span className="sr-only">Schedule Contact</span></PillBtn>
          </div>
          <div>
            <Label>Key Focus Areas</Label>
            <h3 className="text-2xl font-black text-[#0a0a0a] tracking-[-0.02em] mb-6">What I Specialize In</h3>
            <div className="space-y-3">
              {focus.map(item => (
                <div key={item} className="flex items-start gap-4 p-4 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl">
                  <CheckCircle size={16} className="text-[#0070f3] shrink-0" />
                  <span className="text-[#525252] text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CTABanner navigate={navigate} />
    </div>
  );
}
