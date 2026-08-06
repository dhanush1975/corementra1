import { CheckCircle } from "lucide-react";
import { Page, PillBtn, Label, SectionHeading, CTABanner, CALENDLY_URL, inter } from "./shared";

export function HNWIPage({ navigate }: { navigate: (p: Page) => void }) {
  const bullets = [
    "Minimizing tax burdens and avoiding probate",
    "Using Irrevocable Life Insurance Trusts (ILITs) to reduce estate taxes",
    "Protecting your wealth from creditors",
    "Seamless transfer of wealth to future generations",
    "Customized strategies for complex estates",
    "Coordination with your existing advisors and attorneys",
  ];

  return (
    <div style={{ fontFamily: inter }}>
      <section className="relative pt-40 pb-24 px-6 bg-white overflow-hidden border-b border-[#e5e5e5]">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1600&h=800&fit=crop&auto=format" alt="" className="w-full h-full object-cover opacity-[0.05]" />
        </div>
        <div className="relative z-10 max-w-[1200px] mx-auto">
          <Label>Advanced Planning</Label>
          <SectionHeading className="mb-4">High Net Worth<br />Estate Planning</SectionHeading>
          <p className="text-[#737373] text-[15px]">Protect Your Legacy</p>
        </div>
      </section>

      <section className="py-20 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <Label>Preserve Your Wealth</Label>
            <SectionHeading className="text-4xl mb-6">Ensure your wealth is protected and efficiently passed on</SectionHeading>
            <p className="text-[#737373] leading-relaxed mb-6 text-[15px]">With customized estate planning, I focus on strategies that preserve more of your wealth for the people and causes that matter most — while minimizing what goes to taxes and legal costs.</p>
            <p className="text-[#a3a3a3] font-medium mb-8 text-[15px]">What if I could help you create a plan that preserves your legacy for future generations?</p>
            <PillBtn href={CALENDLY_URL}>Schedule A Meeting <span className="sr-only">Contact</span></PillBtn>
          </div>
          <div>
            <Label>I Focus On:</Label>
            <div className="space-y-3">
              {bullets.map(b => (
                <div key={b} className="flex items-start gap-4 p-4 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl">
                  <CheckCircle size={15} className="text-[#0070f3] shrink-0 mt-0.5" />
                  <span className="text-[#525252] text-sm">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 border-t border-[#e5e5e5] bg-[#fafafa]">
        <div className="max-w-[800px] mx-auto border border-[#e5e5e5] bg-white rounded-2xl p-8 md:p-12 text-center">
          <Label>Estate Planning Tool</Label>
          <h2 className="text-2xl font-black text-[#0a0a0a] tracking-[-0.02em] mb-4">What is an ILIT?</h2>
          <p className="text-[#737373] leading-relaxed text-[15px]">An Irrevocable Life Insurance Trust (ILIT) is a powerful estate planning tool that can remove life insurance proceeds from your taxable estate. When structured correctly, an ILIT can significantly reduce estate taxes and ensure that more of your wealth passes to your heirs — not to the government.</p>
        </div>
      </section>

      <CTABanner navigate={navigate} />
    </div>
  );
}
