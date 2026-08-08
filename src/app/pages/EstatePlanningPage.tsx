import { Page, PillBtn, Label, SectionHeading, Card, StatRow, CTABanner, inter } from "./shared";

export function EstatePlanningPage({ navigate }: { navigate: (p: Page) => void }) {
  const areas = [
    { title: "Protect Yourself & Family", desc: "Disability, long-term care, and life insurance strategies tailored to your needs." },
    { title: "Safeguard Loved Ones", desc: "Business transfer, guardians for minor children, special needs planning, and creditor protection." },
    { title: "Avoid Costly Mistakes", desc: "Minimize taxes, avoid probate, and ensure your wishes are legally documented." },
    { title: "Plan Now", desc: "Without a plan, courts may intervene — taking the decisions out of your hands entirely." },
  ];

  const questions = [
    "Who cares for underage children if something happens to you?",
    "Who inherits your home, bank accounts, and business?",
    "Who handles your medical and healthcare decisions?",
    "How do your loved ones avoid a lengthy probate process?",
  ];

  return (
    <div style={{ fontFamily: inter }}>
      <section className="relative pt-40 pb-24 px-6 bg-white overflow-hidden border-b border-[#e5e5e5]">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1600&h=800&fit=crop&auto=format" alt="" className="w-full h-full object-cover opacity-[0.05]" />
        </div>
        <div className="relative z-10 max-w-[1200px] mx-auto">
          <Label>Your Legacy</Label>
          <SectionHeading className="mb-4">Estate Planning</SectionHeading>
          <p className="text-[#737373] text-[15px]">Control of Your Legacy = Peace of Mind</p>
        </div>
      </section>

      <StatRow
        stats={[
          { num: "1 in 6", label: "Americans face a will or trust contest after a loved one dies" },
          { num: "50%+", label: "Of Americans lack a will, leaving assets to state law" },
          { num: "All Ages", label: "Estate planning applies to every age and income level" },
          { num: "Now", label: "The best time to plan is before you need it" },
        ]}
      />

      <section className="py-20 px-6 border-t border-[#e5e5e5] bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
            <div>
              <Label>For Everyone</Label>
              <SectionHeading className="text-4xl mb-6">Estate Planning is for Everyone</SectionHeading>
              <p className="text-[#737373] leading-relaxed mb-6 text-[15px]">Estate planning is not just for the wealthy. It applies to all ages and income levels. Families with modest assets may face even greater consequences from poor planning.</p>
              <h3 className="text-lg font-bold text-[#0a0a0a] mb-3 tracking-[-0.01em]">Do You Have An Estate?</h3>
              <p className="text-[#737373] text-[15px] leading-relaxed">Your estate covers nearly everything you own — your home, car, accounts, insurance policies, investments, and personal belongings. If you own anything of value, you have an estate and you need a plan.</p>
            </div>
            <div>
              <Label>Key Questions</Label>
              <h3 className="text-2xl font-black text-[#0a0a0a] tracking-[-0.02em] mb-6">Have You Answered These?</h3>
              <div className="space-y-3">
                {questions.map(q => (
                  <div key={q} className="flex items-start gap-3 p-4 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl">
                    <div className="w-5 h-5 rounded-full bg-[#efefef] border border-[#d4d4d4] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[#a3a3a3] text-xs font-bold">?</span>
                    </div>
                    <span className="text-[#525252] text-sm">{q}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-16">
            <h2 className="text-2xl font-black text-[#0a0a0a] tracking-[-0.02em] mb-6">Four Key Areas I Cover</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {areas.map(a => (
                <Card key={a.title}>
                  <h3 className="text-base font-bold text-[#0a0a0a] mb-2">{a.title}</h3>
                  <p className="text-sm text-[#737373] leading-relaxed">{a.desc}</p>
                </Card>
              ))}
            </div>
          </div>

          <div className="border border-[#e5e5e5] rounded-2xl p-8 md:p-12 bg-[#fafafa]">
            <h2 className="text-2xl font-black text-[#0a0a0a] tracking-[-0.02em] mb-8 text-center">Will vs. Living Trust: What's Best for You?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-[#e5e5e5] rounded-xl p-6">
                <h3 className="text-[#0a0a0a] font-bold text-lg mb-3">Will</h3>
                <p className="text-[#737373] text-sm leading-relaxed">A will distributes your assets after death but typically requires probate — a public court process that can be time-consuming and costly for your family.</p>
              </div>
              <div className="bg-[#eff6ff] border border-[#0070f3]/20 rounded-xl p-6">
                <h3 className="text-[#0a0a0a] font-bold text-lg mb-3">Living Trust</h3>
                <p className="text-[#525252] text-sm leading-relaxed">A living trust takes effect immediately and helps your family avoid probate entirely — keeping your affairs private and distributing assets more quickly.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTABanner navigate={navigate} />
    </div>
  );
}
