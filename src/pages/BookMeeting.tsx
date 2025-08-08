import React, { useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const BookMeeting: React.FC = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <>
      <Header />
      <div className="bg-white text-black min-h-screen flex flex-col">
        <main className="flex-grow flex justify-center items-center px-4 py-8">
          <div className="w-full max-w-[1200px]">
            <h1 className="text-3xl font-bold text-center text-blue-800 mb-8">
              Schedule Your Meeting
            </h1>
            <div
              className="calendly-inline-widget"
              data-url="https://calendly.com/amit-arakeswara/amit-arakeswara-s-calendar"
              style={{ height: '800px', width: '100%' }}
            />
          </div>
        </main>
        <Footer className="bg-blue-100" />
      </div>
    </>
  );
};

export default BookMeeting;
