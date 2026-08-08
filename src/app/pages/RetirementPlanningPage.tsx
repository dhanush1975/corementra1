import { ArrowRight, CheckCircle } from "lucide-react";
import { Page, PillBtn, Label, SectionHeading, Card, StatRow, CTABanner, inter } from "./shared";

export function RetirementPlanningPage({ navigate }: { navigate: (p: Page) => void }) {
  const risks = [
    {
      title: "Longevity Risk",
      desc: "People are living longer, and retirement savings often need to stretch across 20–30+ years. A long-term care need or an unexpectedly long life can strain a plan that wasn't built to last that far.",
    },
    {
      title: "Inflation Risk",
      desc: "Rising prices quietly shrink what your money can buy. A retirement income that looks sufficient today can fall short a decade in if it isn't structured to keep pace with the cost of living.",
    },
    {
      title: "Health Risk",
      desc: "Healthcare is consistently one of the largest expenses in retirement, and an unplanned illness or long-term care need can draw down savings far faster than everyday spending.",
    },
    {
      title: "Tax Risk",
      desc: "Money in tax-deferred accounts is taxed on the way out, not the way in — and tax rates decades from now are unknown. A shift in policy can quietly reduce the income you actually get to keep.",
    },
    {
      title: "Market Risk",
      desc: "A downturn early in retirement is far more damaging than the same downturn mid-career, since you're drawing income out of a shrinking balance instead of adding to a growing one.",
    },
    {
      title: "Interest Rate Risk",
      desc: "Bonds, CDs, and other fixed-income holdings are sensitive to rate changes. Falling rates can quietly reduce the income those assets were expected to generate.",
    },
    {
      title: "Withdrawal Risk",
      desc: "Pulling money out too aggressively in the early years — whether by choice or by emergency — can permanently shorten how long a portfolio lasts.",
    },
  ];

  const reasons = [
    { title: "It's Not Widely Taught", desc: "Many advisors are trained on the standard menu of 401(k)s and IRAs — not on the specialized accounts built specifically for guaranteed, protected retirement income." },
    { title: "The Incentives Don't Line Up", desc: "Some financial products pay a bigger upfront commission than others. That can quietly shape what gets recommended, even when it isn't the best fit for you." },
    { title: "There's Less Ongoing Fee Revenue", desc: "Accounts with strong principal protection generate less recurring management-fee income than market-based portfolios, so they're recommended less often." },
  ];

  const consequences = [
    { title: "Financial Strain", desc: "Without enough saved, Social Security alone rarely covers a comfortable cost of living — leaving a gap that has to come from somewhere." },
    { title: "A Smaller Life", desc: "Coming up short in retirement often means cutting the things that make it enjoyable — travel, hobbies, even everyday comforts." },
    { title: "Added Stress", desc: "Financial pressure in retirement doesn't stay financial — it tends to show up as anxiety and strain on physical and mental health too." },
  ];

  const taxDeferredLimitations = [
    { title: "Ongoing Fees", desc: "Most accounts carry fund and administrative fees that quietly reduce net growth over time." },
    { title: "Limited Access", desc: "Withdrawals before retirement age are restricted and can trigger penalties on top of taxes owed." },
    { title: "Market-Dependent Growth", desc: "Your balance moves with the market, so its value can rise or fall from year to year." },
    { title: "No Guaranteed Income", desc: "Without a separate income strategy, how long the balance lasts depends on markets and withdrawal timing." },
  ];

  const sraSteps = [
    { num: "1", title: "Accumulate for Retirement", desc: "Build savings steadily, on your own timeline." },
    { num: "2", title: "100% Principal Protection", desc: "Never lose what you've already put in." },
    { num: "3", title: "Grow Tax-Deferred", desc: "Compound without a yearly tax drag." },
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
          <div className="text-center mb-12">
            <Label>An Honest Question</Label>
            <SectionHeading className="text-4xl mb-3">Why Hasn't My Advisor Mentioned This?</SectionHeading>
            <p className="text-[#737373] max-w-xl mx-auto text-[15px]">Strategies like the SRA account aren't a secret — but they're not the default recommendation either. A few reasons why:</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reasons.map((r, i) => (
              <Card key={r.title}>
                <div className="w-8 h-8 rounded-full bg-[#0a0a0a] text-white flex items-center justify-center font-bold text-xs mb-4">{i + 1}</div>
                <h3 className="text-base font-bold text-[#0a0a0a] mb-2">{r.title}</h3>
                <p className="text-sm text-[#737373] leading-relaxed">{r.desc}</p>
              </Card>
            ))}
          </div>
          <p className="text-[#a3a3a3] text-sm text-center max-w-2xl mx-auto mt-8 leading-relaxed">
            The result: fewer than 1 in 5 Americans have this type of account set up, while most retirement savings sits as a lump sum with no real protection against running out.
          </p>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-[#e5e5e5] bg-[#fafafa]">
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-10">
            <Label>Without a Plan</Label>
            <SectionHeading className="text-4xl mb-3">What's at Stake</SectionHeading>
            <p className="text-[#737373] text-[15px] max-w-xl">Going into retirement without a plan tends to show up in the same few ways.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {consequences.map(c => (
              <Card key={c.title} className="bg-white">
                <h3 className="text-base font-bold text-[#0a0a0a] mb-2">{c.title}</h3>
                <p className="text-sm text-[#737373] leading-relaxed">{c.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-[#e5e5e5] bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
            <div>
              <Label>Good to Know</Label>
              <SectionHeading className="text-4xl mb-6">How a 401(k) / IRA Works</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {taxDeferredLimitations.map(d => (
                  <div key={d.title} className="p-4 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#a3a3a3] shrink-0" />
                      <span className="text-sm font-bold text-[#0a0a0a]">{d.title}</span>
                    </div>
                    <p className="text-xs text-[#737373] leading-relaxed">{d.desc}</p>
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
            <div className="mb-10 max-w-2xl">
              <Label>Be Prepared</Label>
              <SectionHeading className="text-4xl mb-3">Seven Retirement Risks</SectionHeading>
              <p className="text-[#737373] text-[15px]">Even a well-funded retirement can be derailed by risks that are easy to overlook until they show up. Understanding them is the first step to planning around them.</p>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {sraSteps.map(s => (
              <Card key={s.num}>
                <div className="w-8 h-8 rounded-full bg-[#0070f3] text-white flex items-center justify-center font-bold text-xs mb-4">{s.num}</div>
                <h3 className="text-[#0a0a0a] font-bold text-base mb-1.5">{s.title}</h3>
                <p className="text-[#737373] text-sm leading-relaxed">{s.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <CTABanner navigate={navigate} />
    </div>
  );
}
