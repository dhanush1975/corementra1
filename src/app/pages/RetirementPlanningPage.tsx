import { ArrowRight, CheckCircle } from "lucide-react";
import { Page, PillBtn, Label, SectionHeading, Card, StatRow, CTABanner, inter } from "./shared";

export function RetirementPlanningPage({ navigate }: { navigate: (p: Page) => void }) {
  const risks = [
    { title: "Longevity Risk", desc: "Outliving your savings as life expectancy continues to rise." },
    { title: "Inflation Risk", desc: "Rising costs eroding the purchasing power of your fixed income." },
    { title: "Health Risk", desc: "Average retired couple may need over $300,000 for healthcare." },
    { title: "Tax Risk", desc: "Future tax increases reducing your retirement income." },
    { title: "Market Risk", desc: "Market downturns devastating your portfolio at the wrong time." },
    { title: "Interest Rate Risk", desc: "Low rates reducing income from bonds and savings accounts." },
    { title: "Withdrawal Risk", desc: "Taking too much too early and depleting savings prematurely." },
  ];

  const sraBenefits = [
    "Retirement accumulation with consistent growth",
    "100% Principal Protection — never lose what you put in",
    "Tax-deferred growth for maximum compounding",
    "Guaranteed Lifetime Income you cannot outlive",
    "Probate avoidance for seamless wealth transfer",
    "Flexible Income Options to suit your lifestyle",
  ];

  return (
    <div style={{ fontFamily: inter }}>
      <section className="relative pt-40 pb-24 px-6 bg-white overflow-hidden border-b border-[#e5e5e5]">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1600&h=800&fit=crop&auto=format" alt="" className="w-full h-full object-cover opacity-[0.05]" />
        </div>
        <div className="relative z-10 max-w-[1200px] mx-auto">
          <Label>Your Future</Label>
          <SectionHeading className="mb-4">Retirement Planning</SectionHeading>
          <p className="text-[#737373] text-[15px]">Dreaming of a Retirement? Find out When It Can be A Reality.</p>
        </div>
      </section>

      <StatRow
        stats={[
          { num: "10.7%", label: "Of Americans have retired into poverty" },
          { num: "~55%", label: "Of retirees depend on Social Security as primary income" },
          { num: "~20%", label: "Of retirees hold under $10,000 in total savings" },
          { num: "< 20%", label: "Of Americans have an SRA account established" },
        ]}
      />

      <section className="py-20 px-6 border-t border-[#e5e5e5] bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
            <div>
              <Label>Know the Risks</Label>
              <SectionHeading className="text-4xl mb-6">401(k) / IRA Drawbacks</SectionHeading>
              <div className="space-y-4">
                {[
                  "Hidden fees eroding your savings over time",
                  "No guaranteed principal protection from market losses",
                  "Limited liquidity with steep early withdrawal penalties",
                  "Risk of outliving your funds in a long retirement",
                ].map(d => (
                  <div key={d} className="flex items-start gap-3 text-[15px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />
                    <span className="text-[#737373]">{d}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>The Solution</Label>
              <SectionHeading className="text-4xl mb-6">Six SRA Benefits</SectionHeading>
              <div className="space-y-3">
                {sraBenefits.map(b => (
                  <div key={b} className="flex items-start gap-3 p-3 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl">
                    <CheckCircle size={15} className="text-[#0070f3] shrink-0 mt-0.5" />
                    <span className="text-[#525252] text-sm">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-16">
            <div className="mb-10">
              <Label>Be Prepared</Label>
              <SectionHeading className="text-4xl">Seven Retirement Risks</SectionHeading>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {risks.map((r, i) => (
                <Card key={r.title}>
                  <div className="text-3xl font-black text-[#e5e5e5] mb-3 tracking-[-0.04em]">0{i + 1}</div>
                  <h3 className="font-bold text-[#0a0a0a] text-sm mb-2">{r.title}</h3>
                  <p className="text-[#737373] text-xs leading-relaxed">{r.desc}</p>
                </Card>
              ))}
            </div>
          </div>

          <div className="border border-[#e5e5e5] rounded-2xl p-8 md:p-12 bg-[#fafafa]">
            <div className="mb-8">
              <Label>A Proven Strategy</Label>
              <SectionHeading className="text-4xl">The SRA Strategy</SectionHeading>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <p className="text-[#737373] leading-relaxed text-[15px]">This strategy has been used by wealthy families for over a century. Historical users include Benjamin Franklin, Babe Ruth, and several U.S. presidents. Less than 20% of Americans have this type of account established.</p>
              <div className="space-y-4">
                <p className="text-[#a3a3a3] text-sm font-medium uppercase tracking-[0.08em]">Ask yourself:</p>
                {[
                  "Will my savings outlast my lifetime?",
                  "Are my assets shielded from market volatility?",
                  "Is guaranteed lifetime income part of my plan?",
                ].map(q => (
                  <div key={q} className="flex items-start gap-3 text-[#737373] text-sm">
                    <ArrowRight size={14} className="text-[#0070f3] shrink-0 mt-0.5" />{q}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTABanner navigate={navigate} />
    </div>
  );
}
