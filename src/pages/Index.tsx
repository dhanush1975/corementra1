import React from 'react';
import { Header } from '../components/Header';
import HeroSection from '../components/HeroSection';
import { TestimonialsSection } from '../components/TestimonialsSection';
import { MissionSection } from '../components/MissionSection';
import FocusSection from '../components/FocusSection';
import { ProcessSection } from '../components/ProcessSection';
import { CTASection } from '../components/CTASection';
import { Footer } from '../components/Footer';

const Index: React.FC = () => {
  return (
    <div
      className="app-container bg-financial-light"
      style={{
        width: '100vw',
        minHeight: '100vh',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ width: '100vw', flexShrink: 0 }}>
        <Header />
      </div>
      
      <main
        style={{
          width: '100vw',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ width: '100vw', flexShrink: 0 }}>
          <HeroSection />
        </div>
        
        <div style={{ width: '100vw', flexShrink: 0 }}>
          <MissionSection />
        </div>
        
        <div style={{ width: '100vw', flexShrink: 0 }}>
          <FocusSection />
        </div>
        
        <div style={{ width: '100vw', flexShrink: 0 }}>
          <ProcessSection />
        </div>
        
        <div style={{ width: '100vw', flexShrink: 0 }}>
          <CTASection />
        </div>
      </main>
      
      <div style={{ width: '100vw', flexShrink: 0 }}>
        <Footer />
      </div>
    </div>
  );
};

export default Index;