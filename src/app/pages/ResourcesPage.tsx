import { ArrowRight, CheckCircle, Newspaper, Mic, PlayCircle, Quote } from "lucide-react";
import { Page, PillBtn, Label, SectionHeading, Card, CTABanner, CALENDLY_URL, inter } from "./shared";

export function ResourcesPage({ navigate }: { navigate: (p: Page) => void }) {
  const steps = [
    { num: "1", title: "Establish a Budget", desc: "Know exactly where your money goes each month. Track income versus expenses to identify waste and opportunities." },
    { num: "2", title: "Build an Emergency Fund", desc: "Save 3–6 months of living expenses in a liquid, accessible account before investing elsewhere." },
    { num: "3", title: "Eliminate High-Interest Debt", desc: "Pay off credit cards and high-interest loans aggressively. Debt is the #1 enemy of wealth building." },
    { num: "4", title: "Protect Your Income", desc: "Ensure you have life insurance and disability coverage. Your ability to earn is your greatest asset." },
    { num: "5", title: "Invest for Growth", desc: "Use tax-advantaged accounts and proven strategies to grow your wealth consistently over time." },
    { num: "6", title: "Plan Your Legacy", desc: "Create or update your will, trust, and beneficiary designations. Protect what you build for future generations." },
  ];

  const moneyRules = [
    { title: "Pay Yourself First", desc: "Automate savings the moment you're paid, before spending has a chance to touch it." },
    { title: "Not All Debt Is Equal", desc: "Tell good debt (appreciating, tax-advantaged) apart from bad debt (high-interest, depreciating) and treat them differently." },
    { title: "Insure the Big Risks", desc: "Protect against losses you can't absorb — death, disability, lawsuits. Self-insure the small stuff." },
    { title: "Time Beats Timing", desc: "Consistent, long-term investing outperforms guessing when to jump in or out of the market." },
    { title: "Give Every Dollar a Job", desc: "Spend, save, invest, or give — a dollar without a purpose tends to disappear." },
    { title: "Plan Taxes Year-Round", desc: "Tax strategy is a 12-month discipline, not a scramble every April." },
  ];

  const checklistGroups = [
    {
      label: "This Month",
      items: [
        "Write a budget you'll actually stick to",
        "Confirm 3–6 months of expenses are saved in an emergency fund",
        "Check that insurance and account beneficiaries are current",
      ],
    },
    {
      label: "This Year",
      items: [
        "Capture the full employer match on any retirement plan",
        "Review or create your will, trust, and power of attorney",
        "Stress-test your retirement income against inflation",
      ],
    },
    {
      label: "Ongoing",
      items: [
        "Revisit your financial plan annually or after a major life event",
        "Build income sources beyond a single paycheck",
        "Put a legacy plan in place for the next generation",
      ],
    },
  ];

  const insights = [
    { title: "Why \"Set It and Forget It\" Isn't a Retirement Plan", desc: "A plan built for who you were ten years ago rarely fits who you are today. Here's how often it actually deserves a second look." },
    { title: "The Hidden Cost of Waiting on Life Insurance", desc: "Premiums are priced on age and health — both only move in one direction. What delay really costs, in plain numbers." },
    { title: "Trusts Aren't Just for the Wealthy", desc: "Probate, privacy, and control matter at every income level. A look at when a trust earns its cost." },
  ];

  const comingSoon = [
    { icon: <Newspaper size={18} />, title: "In The News", desc: "Press mentions and market commentary." },
    { icon: <Quote size={18} />, title: "Case Studies", desc: "Anonymized, illustrative planning scenarios." },
    { icon: <Mic size={18} />, title: "Podcast", desc: "Conversations on money, wealth, and legacy." },
    { icon: <PlayCircle size={18} />, title: "Videos", desc: "Short, practical explainers." },
  ];

  return (
    <div style={{ fontFamily: inter }}>
      <section className="pt-40 pb-20 px-6 bg-white border-b border-[#e5e5e5]">
        <div className="max-w-[1200px] mx-auto">
          <Label>Learn & Grow</Label>
          <SectionHeading>Resources</SectionHeading>
        </div>
      </section>

      <section className="py-20 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-12">
            <Label>Foundations</Label>
            <SectionHeading className="text-4xl mb-3">6 Steps to Financial Security</SectionHeading>
            <p className="text-[#737373] text-[15px]">Follow these proven steps to build lasting financial security for you and your family.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {steps.map(s => (
              <Card key={s.num} className="relative overflow-hidden">
                <div className="absolute top-4 right-5 text-7xl font-black text-[#efefef] leading-none select-none">{s.num}</div>
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#a3a3a3] mb-3">Step {s.num}</div>
                <h3 className="text-base font-bold text-[#0a0a0a] mb-2 tracking-[-0.01em]">{s.title}</h3>
                <p className="text-sm text-[#737373] leading-relaxed">{s.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-[#e5e5e5] bg-[#fafafa]">
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-12">
            <Label>Rules Of Money</Label>
            <SectionHeading className="text-4xl mb-3">Money Rules to Live By</SectionHeading>
            <p className="text-[#737373] text-[15px]">Simple principles that hold up regardless of the market, your income, or the news cycle.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {moneyRules.map(r => (
              <Card key={r.title} className="bg-white">
                <h3 className="text-base font-bold text-[#0a0a0a] mb-2 tracking-[-0.01em]">{r.title}</h3>
                <p className="text-sm text-[#737373] leading-relaxed">{r.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-[#e5e5e5] bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-12">
            <Label>Financial Checklist</Label>
            <SectionHeading className="text-4xl mb-3">Where to Start</SectionHeading>
            <p className="text-[#737373] text-[15px]">A simple checklist broken into what to handle now, this year, and on an ongoing basis.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {checklistGroups.map(g => (
              <Card key={g.label}>
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#a3a3a3] mb-4">{g.label}</div>
                <div className="space-y-3">
                  {g.items.map(item => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle size={15} className="text-[#0070f3] shrink-0 mt-0.5" />
                      <span className="text-[#525252] text-sm leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-[#e5e5e5] bg-[#fafafa]">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <Label>Blog</Label>
              <SectionHeading className="text-4xl">Insights</SectionHeading>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.map(i => (
              <Card key={i.title} className="bg-white">
                <h3 className="text-base font-bold text-[#0a0a0a] mb-2 tracking-[-0.01em] leading-snug">{i.title}</h3>
                <p className="text-sm text-[#737373] leading-relaxed">{i.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-[#e5e5e5] bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-10">
            <Label>More On The Way</Label>
            <h2 className="text-2xl font-black text-[#0a0a0a] tracking-[-0.02em] mb-2">In The News, Case Studies, Podcast & Videos</h2>
            <p className="text-[#737373] text-[15px] max-w-2xl">These formats are in the works. In the meantime, schedule a free consultation and get the same insights directly.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {comingSoon.map(c => (
              <Card key={c.title} className="bg-[#fafafa]">
                <div className="w-9 h-9 rounded-lg bg-white border border-[#e5e5e5] flex items-center justify-center text-[#a3a3a3] mb-4">
                  {c.icon}
                </div>
                <h3 className="text-sm font-bold text-[#0a0a0a] mb-1">{c.title}</h3>
                <p className="text-xs text-[#a3a3a3] leading-relaxed mb-3">{c.desc}</p>
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#d4d4d4]">Coming Soon</span>
              </Card>
            ))}
          </div>
          <div className="mt-8">
            <PillBtn href={CALENDLY_URL}>Schedule a Meeting <ArrowRight size={14} /></PillBtn>
          </div>
        </div>
      </section>

      <CTABanner navigate={navigate} />
    </div>
  );
}
