import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

export const CTASection = () => {
  return (
    <section className="py-20 bg-financial-light">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-financial-dark mb-6 leading-tight font-inter">
            Ready to Plan with confidence?
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed mb-8 font-inter">
            Schedule a free consultation today and take the first step toward clarity, security, and long-term peace of mind.
          </p>
          
          <Link to="/book-meeting">
  <button className="bg-financial-gold text-white px-8 py-4 rounded-lg font-semibold hover:bg-financial-gold/90 hover:scale-105 transition-all duration-300 shadow-lg font-inter text-lg">
    Book a meeting
  </button>
</Link>
        </div>
      </div>
    </section>
  );
};