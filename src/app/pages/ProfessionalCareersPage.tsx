import { CheckCircle } from "lucide-react";
import { Page, PillBtn, Label, SectionHeading, CTABanner, CALENDLY_URL, inter } from "./shared";

export function ProfessionalCareersPage({ navigate }: { navigate: (p: Page) => void }) {
  const benefits = [
    "Part-time or full-time flexibility to fit your lifestyle",
    "A proven platform that works for diverse backgrounds",
    "Full training, support, and access to industry-leading tools",
    "Personalized mentorship and a clear path to success",
    "Build your own business with a time-tested system",
    "No prior financial experience required",
  ];

  return (
    <div style={{ fontFamily: inter }}>
      <section className="relative pt-40 pb-24 px-6 bg-white overflow-hidden border-b border-[#e5e5e5]">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1600&h=800&fit=crop&auto=format" alt="" className="w-full h-full object-cover opacity-[0.05]" />
        </div>
        <div className="relative z-10 max-w-[1200px] mx-auto">
          <Label>Opportunity</Label>
          <SectionHeading className="mb-4">Professional Careers</SectionHeading>
          <p className="text-[#737373] text-[15px]">Are you ready to take control of your Future?</p>
        </div>
      </section>

      <section className="py-20 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <Label>Build Your Business</Label>
            <SectionHeading className="text-4xl mb-6">An Opportunity Built for You</SectionHeading>
            <p className="text-[#737373] leading-relaxed mb-6 text-[15px]">I offer an opportunity to build your own business with my full support and guidance. Whether you are looking for a part-time income or a full-time career, I have a path for you.</p>
            <p className="text-[#737373] leading-relaxed mb-6 text-[15px]">With a time-tested system, personalized mentorship, and a clear path to achieving your dreams, you will have everything you need to succeed — regardless of your background.</p>
            <p className="text-[#a3a3a3] font-medium mb-8 text-sm">Take the first step toward your future — schedule your free consultation with me today!</p>
            <PillBtn href={CALENDLY_URL}>Schedule A Meeting <span className="sr-only">Contact</span></PillBtn>
          </div>
          <div className="space-y-3">
            {benefits.map(b => (
              <div key={b} className="flex items-start gap-4 p-4 bg-[#f5f5f5] border border-[#e5e5e5] rounded-xl">
                <CheckCircle size={16} className="text-[#0070f3] shrink-0 mt-0.5" />
                <span className="text-[#525252] text-sm">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTABanner navigate={navigate} />
    </div>
  );
}
