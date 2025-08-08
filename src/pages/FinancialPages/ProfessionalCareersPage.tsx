import React from 'react';
// Temporarily commenting out Header and Footer imports to isolate the issue
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';

interface ButtonProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({ children, size = 'md', className = '', onClick }) => {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${sizeClasses[size]} font-semibold rounded-lg transition-all duration-300 ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

const ProfessionalCareersPage: React.FC = () => {
  const handleBookMeeting = () => {
    console.log('Book a meeting clicked');
    // Add your actual meeting booking logic here
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-100 relative">
      {/* Header - Temporarily commented out to test */}
      <Header />

      {/* Background Design Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/30 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-sky-200/40 rounded-full blur-2xl"></div>
        <div className="absolute bottom-32 left-1/4 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
          <svg viewBox="0 0 200 600" className="w-full h-full">
            <path d="M0,100 Q50,50 100,100 T200,100 L200,0 L0,0 Z" fill="url(#blueGradient)" />
            <path d="M0,300 Q50,250 100,300 T200,300 L200,200 L0,200 Z" fill="url(#lightBlueGradient)" />
            <defs>
              <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#dbeafe" />
                <stop offset="100%" stopColor="#bfdbfe" />
              </linearGradient>
              <linearGradient id="lightBlueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#e0f2fe" />
                <stop offset="100%" stopColor="#cffafe" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex-grow px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-1 bg-gradient-to-r from-blue-300 to-sky-300 rounded-full"></div>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-800 mb-8 leading-tight">
            Professional{' '}
            <span className="bg-gradient-to-r from-blue-500 to-sky-400 bg-clip-text text-transparent">
              Careers
            </span>
          </h1>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-blue-800 mb-12">
            Are you ready to take control of your Future?
          </h2>

          <div className="space-y-8 mb-12">
            <p className="text-base sm:text-lg lg:text-xl leading-relaxed text-gray-700">
              I offer an opportunity to build your own business with my full support and guidance.
              Whether you're looking for a full-time career change or a part-time income stream, my
              proven platform empowers individuals from all backgrounds to succeed.
            </p>
            <p className="text-base sm:text-lg lg:text-xl leading-relaxed text-gray-700">
              With a time-tested system, personalized mentorship, and a clear path to achieving your
              dreams, this is your chance to become a successful entrepreneur in a thriving industry.
            </p>
            <p className="text-base sm:text-lg lg:text-xl leading-relaxed text-gray-700 font-medium">
              Take the first step toward your future—schedule your free consultation with me today!
            </p>
          </div>

          <div className="flex justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-xl hover:shadow-blue-300/30 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
              onClick={handleBookMeeting}
            >
              Schedule A Meeting
            </Button>
          </div>
        </div>
      </main>

      {/* Footer - Temporarily commented out to test */}
      <Footer className="bg-blue-100" />
    </div>
  );
};

export default ProfessionalCareersPage;