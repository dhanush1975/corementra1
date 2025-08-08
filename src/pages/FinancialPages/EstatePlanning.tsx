import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Users, FileText, Clock, Check, ArrowRight } from 'lucide-react';
import { Footer } from '@/components/Footer'; // Ensure correct import path
import { Header } from '@/components/Header';

const Index = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <Header />
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-128 h-128 bg-blue-100/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
          style={{
            backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.8), rgba(30, 58, 138, 0.7)), url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`
          }}
        />
        
        <div className={`relative z-10 text-center px-4 max-w-4xl mx-auto transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 md:p-12 hover:bg-black/50 transition-all duration-500 hover:scale-105">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
              <span className="inline-block hover:scale-110 transition-transform duration-300">Estate</span>{' '}
              <span className="inline-block hover:scale-110 transition-transform duration-300 delay-100">Planning</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-4 animate-fade-in delay-300">
              1 in 6 Americans experience a will or trust contest after a loved one dies.
            </p>
            <div className="text-white/90 space-y-4 mb-8 animate-fade-in delay-500">
              <p className="hover:text-white transition-colors duration-300">
                A will or trust contest is a legal battle over the distribution of an estate. These 
                contests can be costly and time-consuming. Statistics show that more than half 
                of Americans do not have a will.
              </p>
              <p className="hover:text-white transition-colors duration-300">
                This means that their assets will be distributed according to state law, which 
                may not be what they would have wanted.
              </p>
            </div>
            {/* <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl animate-fade-in delay-700 group"
            >
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button> */}
          </div>
        </div>

        {/* Floating icons */}
        <div className="absolute top-20 left-10 animate-bounce delay-1000">
          <Shield className="h-8 w-8 text-blue-300/50" />
        </div>
        <div className="absolute top-32 right-20 animate-bounce delay-1500">
          <Users className="h-6 w-6 text-blue-200/50" />
        </div>
        <div className="absolute bottom-20 left-20 animate-bounce delay-2000">
          <FileText className="h-7 w-7 text-blue-400/50" />
        </div>
      </section>

      {/* Estate Planning for Everyone Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="transform transition-all duration-700 hover:translate-x-2">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6 hover:text-blue-700 transition-colors duration-500">
                Estate Planning is for Everyone
              </h2>
              <div className="space-y-6 text-lg text-slate-600">
                <p className="hover:text-slate-800 transition-colors duration-300 hover:translate-x-1 transform">
                  Estate planning is important for everyone, not just retirees or the wealthy. While people may think about it 
                  more as they age, the reality is that we can't predict our lifespan, and unexpected events can happen at 
                  any age.
                </p>
                <p className="hover:text-slate-800 transition-colors duration-300 hover:translate-x-1 transform delay-100">
                  For families with modest assets, good estate planning can have an even greater impact as the 
                  consequences of poor planning can be more detrimental to their financial well-being.
                </p>
              </div>
              
            </div>
            <div className="relative transform hover:scale-105 transition-all duration-500">
              <div className="bg-blue-600/10 backdrop-blur-sm rounded-2xl p-8 border border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-xl">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center group">
                    <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:bg-blue-700">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors duration-300">Protection</h3>
                  </div>
                  <div className="text-center group">
                    <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:bg-blue-700 delay-100">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors duration-300">Family Care</h3>
                  </div>
                  <div className="text-center group">
                    <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:bg-blue-700 delay-200">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors duration-300">Documentation</h3>
                  </div>
                  <div className="text-center group">
                    <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:bg-blue-700 delay-300">
                      <Clock className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors duration-300">Planning</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Do You Have An Estate Section */}
      <section className="py-20 px-4 bg-slate-900 text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 hover:text-blue-300 transition-colors duration-500 transform hover:scale-105">
            Do You Have An Estate?
          </h2>
          <div className="space-y-6 text-lg text-slate-300 mb-12">
            <p className="hover:text-white transition-colors duration-300 transform hover:translate-y-1">
              Nearly everyone has an estate. Your estate includes everything you own such as your car, home, real estate, 
              bank accounts, investments, life insurance, furniture and personal possessions.
            </p>
            <p className="hover:text-white transition-colors duration-300 transform hover:translate-y-1 delay-100">
              When you pass away, you'll likely want to have control over how your assets are distributed to the people or 
              organizations you care about. To ensure your wishes are followed, it's important to provide instructions on 
              who should receive your assets, what they should receive and when they should receive it.
            </p>
            <p className="hover:text-white transition-colors duration-300 transform hover:translate-y-1 delay-200">
              Estate planning involves making these plans in advance and taking steps to minimize taxes, legal fees and 
              court costs. By planning now, you can make the process easier for your loved ones later.
            </p>
          </div>
        </div>
      </section>

      {/* Control of Your Legacy Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4 hover:text-blue-700 transition-colors duration-500">
              Control of Your Legacy = Peace of Mind
            </h2>
            <p className="text-xl text-slate-600 hover:text-slate-800 transition-colors duration-300">
              Estate planning protects your loved ones, ensures your wishes are honored, and prevents unnecessary legal complications.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-blue-200 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 hover:border-blue-400 group">
              <CardContent className="p-8">
                <div className="bg-blue-600 rounded-full w-12 h-12 flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:bg-blue-700">
                  <span className="text-white font-bold text-xl">1</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4 group-hover:text-blue-700 transition-colors duration-300">Protect Yourself & Your Family</h3>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-start group-hover:text-slate-800 transition-colors duration-300">
                    <Check className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                    Manage your financial and medical affairs if you're incapacitated.
                  </li>
                  <li className="flex items-start group-hover:text-slate-800 transition-colors duration-300">
                    <Check className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-300 delay-100" />
                    Ensure income replacement with disability and long-term care insurance.
                  </li>
                  <li className="flex items-start group-hover:text-slate-800 transition-colors duration-300">
                    <Check className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-300 delay-200" />
                    Provide financial security for your family with life insurance.
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-200 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 hover:border-blue-400 group delay-100">
              <CardContent className="p-8">
                <div className="bg-blue-600 rounded-full w-12 h-12 flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:bg-blue-700">
                  <span className="text-white font-bold text-xl">2</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4 group-hover:text-blue-700 transition-colors duration-300">Safeguard Your Loved Ones</h3>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-start group-hover:text-slate-800 transition-colors duration-300">
                    <Check className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                    Seamlessly transfer your business upon retirement, disability, or death.
                  </li>
                  <li className="flex items-start group-hover:text-slate-800 transition-colors duration-300">
                    <Check className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-300 delay-100" />
                    Appoint guardians for minor children and protect their inheritance.
                  </li>
                  <li className="flex items-start group-hover:text-slate-800 transition-colors duration-300">
                    <Check className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-300 delay-200" />
                    Support family members with special needs while preserving their government benefits.
                  </li>
                  <li className="flex items-start group-hover:text-slate-800 transition-colors duration-300">
                    <Check className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-300 delay-300" />
                    Shield loved ones from financial risks, creditors, or divorce.
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-200 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 hover:border-blue-400 group delay-200">
              <CardContent className="p-8">
                <div className="bg-blue-600 rounded-full w-12 h-12 flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:bg-blue-700">
                  <span className="text-white font-bold text-xl">3</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4 group-hover:text-blue-700 transition-colors duration-300">Avoid Costly Mistakes</h3>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-start group-hover:text-slate-800 transition-colors duration-300">
                    <Check className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                    Minimize taxes, legal fees, and court costs.
                  </li>
                  <li className="flex items-start group-hover:text-slate-800 transition-colors duration-300">
                    <Check className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-300 delay-100" />
                    Avoid probate by aligning your assets with a living trust or estate plan.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Plan Now Section */}
      <section className="py-20 px-4 bg-blue-50 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="text-4xl font-bold text-slate-800 mb-8 hover:text-blue-700 transition-colors duration-500">Why Plan Now?</h2>
          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
            <p className="text-lg text-slate-700 mb-6 hover:text-slate-900 transition-colors duration-300">
              Without an estate plan, the state decides:
            </p>
            <ul className="space-y-3 text-slate-600 mb-8">
              <li className="flex items-start hover:text-slate-800 transition-colors duration-300 transform hover:translate-x-2">
                <span className="text-blue-600 mr-3 animate-pulse">•</span>
                A court may control your assets and appoint guardians for your children.
              </li>
              <li className="flex items-start hover:text-slate-800 transition-colors duration-300 transform hover:translate-x-2 delay-100">
                <span className="text-blue-600 mr-3 animate-pulse delay-500">•</span>
                Intestacy laws might leave your spouse or family financially vulnerable.
              </li>
            </ul>
            <p className="text-lg text-slate-700 mb-8 hover:text-slate-900 transition-colors duration-300">
              Wouldn't you prefer to decide privately who cares for your family, who inherits your assets, and how your 
              legacy is managed?
            </p>
            <p className="text-lg text-slate-700 mb-8 hover:text-slate-900 transition-colors duration-300">
              Schedule your free consultation today and take the first step toward securing your future and protecting your 
              loved ones.
            </p>
            <div className="text-center">
              
            </div>
          </div>
        </div>
      </section>

      {/* Will vs Living Trust Section */}
      <section className="py-20 px-4 bg-slate-900 text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 hover:text-blue-300 transition-colors duration-500">
            Will vs. Living Trust: What's Best for You?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12 mb-12">
            <div className="bg-slate-800 rounded-xl p-8 hover:bg-slate-700 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl group">
              <h3 className="text-2xl font-bold text-blue-400 mb-4 group-hover:text-blue-300 transition-colors duration-300">Will</h3>
              <p className="text-slate-300 mb-4 group-hover:text-white transition-colors duration-300">
                A will outlines how your assets are distributed after death, but probate is required, which can be 
                time-consuming and costly.
              </p>
            </div>
            
            <div className="bg-slate-800 rounded-xl p-8 hover:bg-slate-700 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl group delay-200">
              <h3 className="text-2xl font-bold text-blue-400 mb-4 group-hover:text-blue-300 transition-colors duration-300">Living Trust</h3>
              <p className="text-slate-300 mb-4 group-hover:text-white transition-colors duration-300">
                A living trust takes effect immediately. It helps manage assets during one's lifetime and after 
                death, avoids probate, and saves one's heirs time and money.
              </p>
            </div>
          </div>

          <div className="text-center mb-12">
            <p className="text-xl text-slate-300 mb-8 hover:text-white transition-colors duration-300">
              Not sure which is best for you? Schedule a free consultation today and let's create a plan that fits 
              your needs!
            </p>
            {/* <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg transform hover:scale-105 transition-all duration-300 hover:shadow-xl group"
            >
              Schedule a Meeting
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button> */}
          </div>
        </div>
      </section>

      {/* Final Questions Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-50 rounded-xl p-8 hover:shadow-xl transition-all duration-500 transform hover:scale-105">
            <p className="text-lg text-slate-700 mb-8 hover:text-slate-900 transition-colors duration-300">
              In summary, the main difference between a will and a trust is the timing of when they take effect and 
              how they operate. A will takes effect after you die and must go through probate, while a trust can 
              take effect immediately and can help avoid probate.
            </p>
            
            <h3 className="text-2xl font-bold text-slate-800 mb-6 hover:text-blue-700 transition-colors duration-500">Important Questions to Consider:</h3>
            <ul className="space-y-3 text-slate-600 mb-8">
              <li className="flex items-start hover:text-slate-800 transition-all duration-300 transform hover:translate-x-2 hover:scale-105">
                <span className="text-blue-600 mr-3 animate-pulse">•</span>
                Who will care for your underage children?
              </li>
              <li className="flex items-start hover:text-slate-800 transition-all duration-300 transform hover:translate-x-2 hover:scale-105 delay-75">
                <span className="text-blue-600 mr-3 animate-pulse delay-200">•</span>
                Who gets your home?
              </li>
              <li className="flex items-start hover:text-slate-800 transition-all duration-300 transform hover:translate-x-2 hover:scale-105 delay-150">
                <span className="text-blue-600 mr-3 animate-pulse delay-400">•</span>
                Who inherits all of your bank accounts?
              </li>
              <li className="flex items-start hover:text-slate-800 transition-all duration-300 transform hover:translate-x-2 hover:scale-105 delay-225">
                <span className="text-blue-600 mr-3 animate-pulse delay-600">•</span>
                Who will operate and own your business?
              </li>
              <li className="flex items-start hover:text-slate-800 transition-all duration-300 transform hover:translate-x-2 hover:scale-105 delay-300">
                <span className="text-blue-600 mr-3 animate-pulse delay-800">•</span>
                Can you avoid family arguments over your belongings and keepsakes?
              </li>
              <li className="flex items-start hover:text-slate-800 transition-all duration-300 transform hover:translate-x-2 hover:scale-105 delay-375">
                <span className="text-blue-600 mr-3 animate-pulse delay-1000">•</span>
                Who will make your medical decisions?
              </li>
              <li className="flex items-start hover:text-slate-800 transition-all duration-300 transform hover:translate-x-2 hover:scale-105 delay-450">
                <span className="text-blue-600 mr-3 animate-pulse delay-1200">•</span>
                Who will get your assets?
              </li>
              <li className="flex items-start hover:text-slate-800 transition-all duration-300 transform hover:translate-x-2 hover:scale-105 delay-525">
                <span className="text-blue-600 mr-3 animate-pulse delay-1400">•</span>
                Who decides your healthcare or end-of-life decisions?
              </li>
              <li className="flex items-start hover:text-slate-800 transition-all duration-300 transform hover:translate-x-2 hover:scale-105 delay-600">
                <span className="text-blue-600 mr-3 animate-pulse delay-1600">•</span>
                How will your loved ones avoid probate?
              </li>
            </ul>
            
            <div className="text-center">
              <p className="text-lg text-slate-700 mb-6 hover:text-slate-900 transition-colors duration-300">
                If you have any questions about the above, I can help you clarify them and take control of your 
                {/* future. <strong className="text-blue-600 hover:text-blue-700 transition-colors duration-300">Schedule your free consultation today!</strong> */}
              </p>
              {/* <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg transform hover:scale-105 transition-all duration-300 hover:shadow-xl animate-pulse group"
              >
                Schedule a Meeting
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button> */}
            </div>
          </div>
        </div>
      </section>
      <Footer className="bg-blue-100" />
    </div>
  );
};

export default Index;