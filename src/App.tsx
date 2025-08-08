import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';


// Main pages
import Index from './pages/Index';
import ServicesSection from './pages/ServicesSection';
import AboutUs from './pages/AboutUs';
import BookMeeting from './pages/BookMeeting';

// Financial service pages
import ProfessionalCareersPage from './pages/FinancialPages/ProfessionalCareersPage';
import EstatePlanningPage from './pages/FinancialPages/EstatePlanning';
import RetirementPlanningPage from './pages/FinancialPages/RetirementPlanning';
import NetWorthPage from './pages/FinancialPages/NetWorth';
import LifeInsurance from './pages/FinancialPages/LifeInsurance';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Main pages */}
        <Route path="/" element={<Index />} />
        <Route path="/services" element={<ServicesSection />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/book-meeting" element={<BookMeeting />} />
        
        {/* Financial service detail pages */}
        <Route path="/services/professional-careers" element={<ProfessionalCareersPage />} />
        <Route path="/services/estate-planning" element={<EstatePlanningPage />} />
        <Route path="/services/retirement-planning" element={<RetirementPlanningPage />} />
        <Route path="/services/networth-planning" element={<NetWorthPage />} />
        <Route path="/services/life-insurance" element={<LifeInsurance />} />
        
      </Routes>
    </Router>
  );
}

export default App;