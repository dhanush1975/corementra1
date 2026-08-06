import { CheckCircle } from "lucide-react";
import { Page, PillBtn, Label, SectionHeading, Card, StatRow, CTABanner, inter } from "./shared";

export function LifeInsurancePage({ navigate }: { navigate: (p: Page) => void }) {
  const uses = [
    "Protecting your family's income in your absence",
    "Business loan collateral protection",
    "Buy-sell partnership agreements",
    "Key person insurance for critical employees",
  ];

  const questions = [
    "Is your income replacement planning done?",
    "Do you have college education plans for your dependents?",
    "Is your mortgage protection established?",
    "Are retirement income tax strategies in place?",
  ];

  return (
    <div style={{ fontFamily: inter }}>
      <section className="relative pt-40 pb-24 px-6 bg-white overflow-hidden border-b border-[#e5e5e5]">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&h=800&fit=crop&auto=format" alt="" className="w-full h-full object-cover opacity-[0.05]" />
        </div>
        <div className="relative z-10 max-w-[1200px] mx-auto">
          <Label>Protection</Label>
          <SectionHeading className="mb-4">Life Insurance</SectionHeading>
          <p className="text-[#737373] text-[15px]">Protect your loved ones and secure their future.</p>
        </div>
      </section>

      <StatRow
        stats={[
          { num: "64%", label: "Of Americans 58+ die without life insurance" },
          { num: "2", label: "Main policy types: Term and IUL" },
          { num: "0", label: "Medical exams needed for no-exam term" },
          { num: "0%", label: "Minimum return floor on IUL — never negative" },
        ]}
      />

      <section className="py-20 px-6 border-t border-[#e5e5e5] bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
            <div>
              <Label>The Basics</Label>
              <SectionHeading className="text-4xl mb-6">What is Life Insurance?</SectionHeading>
              <p className="text-[#737373] leading-relaxed mb-6 text-[15px]">Life insurance is a contract with an insurer that pays benefits to protect your income and assets against serious illness or death. A solid financial plan includes life insurance as a cornerstone of protection.</p>
              <p className="text-[#737373] leading-relaxed mb-6 text-[15px]">Coverage amounts depend on your age, health, and chosen coverage level. The right policy provides peace of mind knowing your family is protected no matter what happens.</p>
              <h3 className="text-base font-bold text-[#0a0a0a] mb-4">Key Uses Include:</h3>
              <div className="space-y-3">
                {uses.map(u => (
                  <div key={u} className="flex items-start gap-3">
                    <CheckCircle size={15} className="text-[#0070f3] shrink-0 mt-0.5" />
                    <span className="text-[#737373] text-sm">{u}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Planning Questions</Label>
              <h3 className="text-2xl font-black text-[#0a0a0a] tracking-[-0.02em] mb-6">Have You Considered These?</h3>
              <div className="space-y-3">
                {questions.map(q => (
                  <div key={q} className="p-4 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#efefef] border border-[#d4d4d4] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[#a3a3a3] text-xs font-bold">?</span>
                    </div>
                    <span className="text-[#525252] text-sm">{q}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-black text-[#0a0a0a] tracking-[-0.02em] mb-6">Types of Life Insurance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#a3a3a3] mb-3">Option A</div>
              <h3 className="text-lg font-black text-[#0a0a0a] mb-3 tracking-[-0.02em]">35-Year No-Medical Term with Living Benefits</h3>
              <p className="text-[#737373] text-sm leading-relaxed mb-5">Access benefits while still alive if diagnosed with a chronic, critical, or terminal illness. Coverage that protects you today, not just your family tomorrow.</p>
              <div className="space-y-2 text-sm text-[#a3a3a3]">
                {[
                  "Accelerated death benefit",
                  "Disability income rider",
                  "Income & asset protection",
                ].map(f => (
                  <div key={f} className="flex items-center gap-2"><CheckCircle size={13} className="text-[#0070f3]" /> {f}</div>
                ))}
              </div>
            </Card>
            <div className="bg-[#0a0a0a] rounded-2xl p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#555] mb-3">Option B</div>
              <h3 className="text-lg font-black text-white mb-3 tracking-[-0.02em]">Indexed Universal Life (IUL)</h3>
              <p className="text-[#737373] text-sm leading-relaxed mb-5">Permanent coverage linking cash value growth to stock market indices like the S&P 500, with a guaranteed minimum interest rate floor — so you never experience negative returns.</p>
              <div className="space-y-2 text-sm text-[#737373]">
                {[
                  "Market-linked growth potential",
                  "Guaranteed floor — no negative years",
                  "Permanent lifetime coverage",
                ].map(f => (
                  <div key={f} className="flex items-center gap-2"><CheckCircle size={13} className="text-white" /> {f}</div>
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
