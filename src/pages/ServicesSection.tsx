import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Link } from 'react-router-dom';
import {
  Building2,
  Shield,
  PiggyBank,
  TrendingUp,
  Heart
} from 'lucide-react';

const Services = () => {
  const services = [
    {
      icon: Building2,
      title: "Professional Careers",
      description: "Start your own business with my guidance and the support of a proven system for success.",
      gradient: "from-blue-600 to-cyan-500",
      link: "/services/professional-careers"
    },
    {
      icon: Shield,
      title: "Estate Planning",
      description: "Plan now for how you want your legacy to be handled and how you want your family to be taken care of.",
      gradient: "from-blue-700 to-indigo-600",
      link: "/services/estate-planning"
    },
    {
      icon: PiggyBank,
      title: "Retirement Planning",
      description: "Secure your financial future with effective and personalized retirement planning strategies tailored to your unique needs.",
      gradient: "from-indigo-600 to-purple-600",
      link: "/services/retirement-planning"
    },
    {
      icon: TrendingUp,
      title: "High Net Worth Estate Planning",
      description: "Preserve and transfer your wealth seamlessly with my estate planning strategies, including ILITs, to minimize taxes.",
      gradient: "from-blue-800 to-slate-700",
      link: "/services/networth-planning"
    },
    {
      icon: Heart,
      title: "Life Insurance",
      description: "Protect your loved ones with a plan that secures their future and provides peace of mind.",
      gradient: "from-cyan-600 to-teal-600",
      link: "/services/life-insurance"
    }
  ];


  const ServiceCard = ({ icon: Icon, title, description, gradient, link }) => (
    <div className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white rounded-lg">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
      <div className="relative p-8">
        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-4 group-hover:text-blue-700 transition-colors duration-300">
          {title}
        </h3>
        <p className="text-slate-600 mb-6 leading-relaxed">
          {description}
        </p>
        <Link
          to={link}
          className="w-full block text-center border border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-300 px-4 py-2 rounded-md"
        >
          Read More
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      

      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              Comprehensive Financial Services
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              From career guidance to wealth preservation, we provide expert solutions tailored to your financial journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <ServiceCard key={index} {...service} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-6">Ready to Secure Your Financial Future?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Let's discuss how our comprehensive financial services can help you achieve your goals
          </p>
          <Link to="/book-meeting">
            <button className="bg-white text-blue-900 hover:bg-blue-50 font-semibold px-8 py-3 rounded-md transition-colors">
              Schedule a Consultation
            </button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;