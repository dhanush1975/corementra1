import { useEffect, useState } from "react";
import logo from "@/imports/logo/corementra-logo-trimmed.png";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router";
import {
  ArrowRight,
  CheckCircle,
  ChevronDown,
  Facebook,
  Instagram,
  Linkedin,
  Menu,
  X,
} from "lucide-react";
import {
  Page,
  PillBtn,
  Label,
  SectionHeading,
  Card,
  CALENDLY_URL,
} from "./pages/shared";
import {
  HomePage,
  WhoAmIPage,
  FAQPage,
  ServicesPage,
  ProfessionalCareersPage,
  EstatePlanningPage,
  RetirementPlanningPage,
  HNWIPage,
  LifeInsurancePage,
  ContactPage,
} from "./pages";

const pageToPath: Record<Page, string> = {
  home: "/",
  "who-am-i": "/who-am-i",
  faq: "/faq",
  services: "/services",
  "professional-careers": "/professional-careers",
  "estate-planning": "/estate-planning",
  "retirement-planning": "/retirement-planning",
  "hnwi-estate-planning": "/hnwi-estate-planning",
  "life-insurance": "/life-insurance",
  contact: "/contact",
};

function pathToPage(pathname: string): Page {
  const entry = Object.entries(pageToPath).find(([, path]) => path === pathname);
  return (entry ? (entry[0] as Page) : "home") as Page;
}

function Navbar({ currentPage, navigate }: { currentPage: Page; navigate: (p: Page) => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  const servicePages: { label: string; page: Page }[] = [
    { label: "Professional Careers", page: "professional-careers" },
    { label: "Estate Planning", page: "estate-planning" },
    { label: "Retirement Planning", page: "retirement-planning" },
    { label: "HNWI Estate Planning", page: "hnwi-estate-planning" },
    { label: "Life Insurance", page: "life-insurance" },
  ];

  const go = (p: Page) => {
    navigate(p);
    setMobileOpen(false);
    setServicesOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/50 backdrop-blur-xl border-b border-white/30 shadow-sm" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-1 flex items-center justify-start">
            <button onClick={() => go("home")} className="flex items-center">
              <img src={logo} alt="CoreMentra — Your Wealth. Our Mentra." className="h-8 w-auto" />
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-1 text-sm font-medium text-[#737373] shrink-0">
            <button onClick={() => go("home")} className={`px-3 py-2 rounded-lg transition-colors ${currentPage === "home" ? "text-[#0a0a0a] font-semibold" : "hover:text-[#0a0a0a]"}`}>
              Home
            </button>
            <button onClick={() => go("who-am-i")} className={`px-3 py-2 rounded-lg transition-colors ${currentPage === "who-am-i" ? "text-[#0a0a0a] font-semibold" : "hover:text-[#0a0a0a]"}`}>
              Who Am I
            </button>
            <button onClick={() => go("faq")} className={`px-3 py-2 rounded-lg transition-colors ${currentPage === "faq" ? "text-[#0a0a0a] font-semibold" : "hover:text-[#0a0a0a]"}`}>
              FAQ
            </button>

            <div className="relative" onMouseEnter={() => setServicesOpen(true)} onMouseLeave={() => setServicesOpen(false)}>
              <button onClick={() => go("services")} className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${currentPage === "services" || servicePages.some(s => s.page === currentPage) ? "text-[#0a0a0a]" : "hover:text-[#0a0a0a]"}`}>
                Services <ChevronDown size={13} className={`${servicesOpen ? "rotate-180" : ""} transition-transform`} />
              </button>
              {servicesOpen && (
                <div className="absolute top-full left-0 bg-white border border-[#e5e5e5] rounded-2xl py-2 min-w-[220px] shadow-lg">
                  {servicePages.map(s => (
                    <button key={s.page} onClick={() => go(s.page)} className="w-full text-left px-4 py-2.5 text-sm text-[#737373] hover:text-[#0a0a0a] hover:bg-[#f5f5f5] transition-colors">
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => go("contact")} className={`px-3 py-2 rounded-lg transition-colors ${currentPage === "contact" ? "text-[#0a0a0a] font-semibold" : "hover:text-[#0a0a0a]"}`}>
              Contact
            </button>
          </div>

          <div className="flex-1 flex items-center justify-end gap-3">
            <div className="hidden lg:block">
              <PillBtn href={CALENDLY_URL} className="text-xs">
                Schedule a Meeting
              </PillBtn>
            </div>
            <button className="lg:hidden p-2 text-[#0a0a0a]" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-[#e5e5e5] px-6 py-5 space-y-1">
          {[
            { label: "Home", page: "home" as Page },
            { label: "Who Am I", page: "who-am-i" as Page },
            { label: "FAQ", page: "faq" as Page },
            { label: "Services", page: "services" as Page },
            ...servicePages.map(s => ({ label: `  · ${s.label}`, page: s.page })),
            { label: "Contact", page: "contact" as Page },
          ].map(item => (
            <button key={item.page + item.label} onClick={() => go(item.page)} className="block w-full text-left py-2 px-2 text-sm text-[#737373] hover:text-[#0a0a0a] transition-colors font-medium">
              {item.label}
            </button>
          ))}
          <PillBtn href={CALENDLY_URL} className="w-full justify-center mt-4">Schedule a Meeting</PillBtn>
        </div>
      )}
    </nav>
  );
}

function Footer({ navigate }: { navigate: (p: Page) => void }) {
  return (
    <footer className="bg-[#fafafa] border-t border-[#e5e5e5]" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <img src={logo} alt="CoreMentra — Your Wealth. Our Mentra." className="h-8 w-auto mb-5" />
            <p className="text-sm text-[#737373] leading-relaxed">
              Educating and empowering people to take control of their financial future. Delivering wealth, pride, and peace of mind.
            </p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#a3a3a3] mb-5">Quick Links</div>
            <div className="space-y-3">
              {[
                { label: "Home", page: "home" as Page },
                { label: "Who Am I", page: "who-am-i" as Page },
                { label: "Services", page: "services" as Page },
                { label: "FAQ", page: "faq" as Page },
                { label: "Contact", page: "contact" as Page },
              ].map(l => (
                <button key={l.page} onClick={() => navigate(l.page)} className="block text-sm text-[#737373] hover:text-[#0a0a0a] transition-colors text-left">
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#a3a3a3] mb-5">Connect</div>
            <div className="flex gap-3 mb-6">
              {[
                <svg key="tiktok" viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.83 1.55V6.79a4.85 4.85 0 0 1-1.06-.1z"/></svg>,
                <Linkedin key="li" size={16} />,
                <Facebook key="fb" size={16} />,
                <Instagram key="ig" size={16} />,
              ].map((icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-full border border-[#e5e5e5] flex items-center justify-center text-[#a3a3a3] hover:text-[#0a0a0a] hover:border-[#d4d4d4] transition-all">
                  {icon}
                </a>
              ))}
            </div>
            <p className="text-xs text-[#a3a3a3] leading-relaxed">
              I offer a wide range of products through a network of independent affiliates. I do not provide accounting, legal, or tax advice.
            </p>
          </div>
        </div>
        <div className="border-t border-[#e5e5e5] pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#a3a3a3]">© {new Date().getFullYear()} CoreMentra. All rights reserved.</p>
          <button className="text-xs text-[#a3a3a3] hover:text-[#0a0a0a] transition-colors uppercase tracking-widest">Privacy Policy</button>
        </div>
        <p className="text-xs text-[#c4c4c4] mt-5 leading-relaxed">
          Insurance carriers include: Nationwide, Corebridge, North American, Fidelity & Guarantee, Lincoln Financial, Mutual of Omaha, Athene, Annexus, and others. This is not a solicitation to sell any investment or insurance product.
        </p>
      </div>
    </footer>
  );
}

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const currentPage = pathToPage(location.pathname);
  const pageNavigate = (page: Page) => navigate(pageToPath[page]);

  return (
    <div className="min-h-screen bg-white text-[#0a0a0a]">
      <Navbar currentPage={currentPage} navigate={pageNavigate} />
      <main>
        <div className="pt-16">
          <Routes>
            <Route path="/" element={<HomePage navigate={pageNavigate} />} />
            <Route path="/who-am-i" element={<WhoAmIPage navigate={pageNavigate} />} />
            <Route path="/faq" element={<FAQPage navigate={pageNavigate} />} />
            <Route path="/services" element={<ServicesPage navigate={pageNavigate} />} />
            <Route path="/professional-careers" element={<ProfessionalCareersPage navigate={pageNavigate} />} />
            <Route path="/estate-planning" element={<EstatePlanningPage navigate={pageNavigate} />} />
            <Route path="/retirement-planning" element={<RetirementPlanningPage navigate={pageNavigate} />} />
            <Route path="/hnwi-estate-planning" element={<HNWIPage navigate={pageNavigate} />} />
            <Route path="/life-insurance" element={<LifeInsurancePage navigate={pageNavigate} />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
      <Footer navigate={pageNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
