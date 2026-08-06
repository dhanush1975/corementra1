import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Page, Label, SectionHeading, CTABanner, inter } from "./shared";

export function FAQPage({ navigate }: { navigate: (p: Page) => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "Why choose you? What value do you bring?",
      a: "I help clients make, grow, save, and protect their money while building wealth across generations — foundational, intellectual, and financial. My goal is to be a long-term partner in your financial journey, not just a one-time advisor.",
    },
    {
      q: "Are you a Fiduciary?",
      a: "By law, I am considered a fiduciary. But beyond the legal obligation, my personal values further drive client-first decisions. Your best interest is always my priority.",
    },
    {
      q: "What are your fees or costs?",
      a: "I don't charge any fees directly to you. My compensation comes from financial institutions when clients select their products. This means you get expert guidance at no direct cost.",
    },
    {
      q: "Do you earn commissions on the products you recommend?",
      a: "Yes, but I only partner with A+ rated financial institutions. My advice remains goal-focused and is always based on what is best for your financial situation.",
    },
    {
      q: "Who holds my money?",
      a: "The A+ rated financial institutions I partner with securely manage client assets. These are established, reputable companies with strong track records of financial stability.",
    },
    {
      q: "Are there career opportunities available?",
      a: "Yes! Part-time or full-time roles are available, with full training, support, and access to industry-leading tools. If you are looking to build your own business in the financial services industry, I would love to connect.",
    },
    {
      q: "Am I obligated after a free consultation?",
      a: "Absolutely not. There is no obligation to purchase anything or pay any fees after your free consultation. It is simply a chance for us to connect and explore whether I can help you.",
    },
  ];

  return (
    <div style={{ fontFamily: inter }}>
      <section className="pt-40 pb-20 px-6 bg-white border-b border-[#e5e5e5]">
        <div className="max-w-[1200px] mx-auto">
          <Label>Got Questions?</Label>
          <SectionHeading>Frequently Asked<br />Questions</SectionHeading>
        </div>
      </section>

      <section className="pb-24 px-6 bg-white">
        <div className="max-w-[800px] mx-auto pt-12 space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-[#e5e5e5] rounded-2xl overflow-hidden bg-white">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left text-[#0a0a0a] hover:bg-[#fafafa] transition-colors"
              >
                <span className="font-semibold text-[15px] tracking-[-0.01em] pr-4">{faq.q}</span>
                <ChevronDown size={16} className={`text-[#a3a3a3] shrink-0 transition-transform duration-200 ${openIndex === i ? "rotate-180 text-[#0a0a0a]" : ""}`} />
              </button>
              {openIndex === i && (
                <div className="px-6 pb-5 text-[#737373] text-sm leading-relaxed border-t border-[#e5e5e5] pt-4 bg-[#fafafa]">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <CTABanner navigate={navigate} />
    </div>
  );
}
