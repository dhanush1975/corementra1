import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Footer } from '@/components/Footer'; // Ensure correct import path
import { Header } from '@/components/Header';
import { 
  Calendar,
  CheckCircle,
  Shield,
  TrendingUp,
  DollarSign,
  Heart
} from 'lucide-react';

const Index = () => {
  const scheduleCallback = () => {
    alert('Scheduling feature would be integrated here - redirecting to calendar booking system');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Hero Section */}
      <Header />
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-5xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-8 text-blue-900 leading-tight">
            Dreaming of a Retirement?
          </h1>
          <p className="text-2xl text-blue-700 mb-6 font-medium">
            Find out When It Can be A Reality
          </p>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 mb-12 shadow-lg border border-blue-200">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-800 mb-2">10.7%</div>
                <p className="text-blue-600">of Americans retire into poverty</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-800 mb-2">55%</div>
                <p className="text-blue-600">rely on Social Security as main income</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-800 mb-2">20%</div>
                <p className="text-blue-600">have less than $10,000 in savings</p>
              </div>
            </div>
          </div>
          
          <p className="text-xl text-blue-700 mb-12 max-w-3xl mx-auto">
            What if you could change that with good retirement planning?
          </p>
          
          {/* <Button 
            onClick={scheduleCallback}
            className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 text-xl rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            <Calendar className="w-6 h-6 mr-3" />
            Schedule A Meeting
          </Button> */}
        </div>
      </section>

      {/* Why Financial Advisors Don't Tell You */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-16 text-blue-900">
            Why Hasn't My Financial Advisor Ever Told Me About This?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 hover:shadow-lg transition-shadow duration-300 border-blue-200">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-blue-600 font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-blue-800">Lack of Knowledge</h3>
              <p className="text-gray-600 leading-relaxed">
                Many financial advisors don't even know about this, nor do they know how to utilize it properly to get you the most value.
              </p>
            </Card>
            
            <Card className="p-8 hover:shadow-lg transition-shadow duration-300 border-blue-200">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-blue-600 font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-blue-800">Commission Focus</h3>
              <p className="text-gray-600 leading-relaxed">
                Financial advisors recommend financial vehicles that pay them the highest commissions rather than put your interests first.
              </p>
            </Card>
            
            <Card className="p-8 hover:shadow-lg transition-shadow duration-300 border-blue-200">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-blue-600 font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-blue-800">No Management Fees</h3>
              <p className="text-gray-600 leading-relaxed">
                The advisor can't charge you yearly management fees so it's not worth it for them to use it.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Challenges Without Retirement Plan */}
      <section className="py-20 px-4 bg-blue-50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-16 text-blue-900">
            Challenges Without a Retirement Plan
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
              <DollarSign className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-lg font-bold text-blue-800 mb-3">Financial Hardship</h3>
              <p className="text-gray-600">
                Relying on Social Security benefits that aren't enough to cover living costs for many people.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
              <TrendingUp className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-lg font-bold text-blue-800 mb-3">Reduced Quality of Life</h3>
              <p className="text-gray-600">
                Struggling to make ends meet may force you to reduce your standard of living.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
              <Heart className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-lg font-bold text-blue-800 mb-3">Increased Stress</h3>
              <p className="text-gray-600">
                Financial hardship stress can take a toll on your physical and mental health.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 401k/IRA Problems */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-16 text-blue-900">
            Problems With Tax-Deferred 401(k) or IRA
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-3 h-3 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Fees that are slowly draining your retirement savings</p>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-3 h-3 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Money is not liquid - you can't access it without penalties</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-3 h-3 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Money is not guaranteed and protected from market losses</p>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-3 h-3 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">If you live long enough, you will run out of money during withdrawals</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Retirement Risks */}
      <section className="py-20 px-4 bg-blue-50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-6 text-blue-900">
            Risks Associated With Retirement Planning
          </h2>
          <p className="text-xl text-center text-blue-700 mb-16 max-w-3xl mx-auto">
            Understanding these risks is the first step toward mitigating them and ensuring a comfortable retirement.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Longevity Risk", desc: "People are living longer, increasing the risk of outliving their savings" },
              { title: "Inflation Risk", desc: "Inflation erodes purchasing power over time" },
              { title: "Health Risk", desc: "Medical expenses can rapidly deplete retirement savings" },
              { title: "Tax Risk", desc: "Changes in tax laws can impact retirement income" },
              { title: "Market Risk", desc: "Market volatility can significantly affect retirement investments" },
              { title: "Interest Rate Risk", desc: "Fluctuating rates can impact fixed-income investments" }
            ].map((risk, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
                <h3 className="text-lg font-bold text-blue-800 mb-3">{risk.title}</h3>
                <p className="text-gray-600">{risk.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SRA Benefits */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-16 text-blue-900">
            Six Reasons to Consider a Secured Retirement Account (SRA)
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <TrendingUp className="w-8 h-8" />, title: "Accumulate Money for Retirement" },
              { icon: <Shield className="w-8 h-8" />, title: "100% Principal Protection" },
              { icon: <DollarSign className="w-8 h-8" />, title: "Grow Tax-Deferred" },
              { icon: <CheckCircle className="w-8 h-8" />, title: "Flexible Income Options" },
              { icon: <Heart className="w-8 h-8" />, title: "Guaranteed Lifetime Income" },
              { icon: <Shield className="w-8 h-8" />, title: "Avoid Probate" }
            ].map((benefit, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow duration-300 border-blue-200">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                  {benefit.icon}
                </div>
                <h3 className="font-semibold text-blue-800">{benefit.title}</h3>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Too Good To Be True */}
      <section className="py-20 px-4 bg-blue-50">
        <div className="container mx-auto text-center max-w-5xl">
          <h2 className="text-4xl font-bold mb-8 text-blue-900">
            Is It "Too Good To Be True," You Ask?
          </h2>
          <h3 className="text-3xl font-bold text-blue-700 mb-12">Nope. It's very real</h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 hover:shadow-lg transition-shadow duration-300 border-blue-200">
              <p className="text-gray-700 leading-relaxed">
                Accounts like these have been used by wealthy individuals and families for over 100 years to build fortunes in a tax-free environment.
              </p>
            </Card>
            
            <Card className="p-8 hover:shadow-lg transition-shadow duration-300 border-blue-200">
              <p className="text-gray-700 leading-relaxed">
                <strong>Benjamin Franklin</strong> had an account like this. So did Babe Ruth, Cleveland, McKinley, and Harding.
              </p>
            </Card>
            
            <Card className="p-8 hover:shadow-lg transition-shadow duration-300 border-blue-200">
              <p className="text-gray-700 leading-relaxed">
                A SRA is NOT available just to the super-rich, but can only be set up if you or your family qualify for it.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="container mx-auto text-center max-w-5xl">
          <h2 className="text-4xl font-bold mb-8">
            Are You Ready for a Retirement Filled with Pride, Dignity, and Peace of Mind?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="flex items-center justify-center">
              <CheckCircle className="w-8 h-8 mr-3 text-blue-200" />
              <span className="text-lg">Will your savings last as long as you do?</span>
            </div>
            <div className="flex items-center justify-center">
              <CheckCircle className="w-8 h-8 mr-3 text-blue-200" />
              <span className="text-lg">Are your assets protected from market risks?</span>
            </div>
            <div className="flex items-center justify-center">
              <CheckCircle className="w-8 h-8 mr-3 text-blue-200" />
              <span className="text-lg">Do you have guaranteed lifetime income?</span>
            </div>
          </div>
          
          <p className="text-2xl mb-8 font-medium">
            Take control of your future—schedule your free consultation today!
          </p>
          
          {/* <Button 
            onClick={scheduleCallback}
            className="bg-white text-blue-700 hover:bg-blue-50 px-12 py-6 text-xl rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            <Calendar className="w-6 h-6 mr-3" />
            Schedule A Meeting
          </Button> */}
        </div>
      </section>
      <Footer className="bg-blue-100" />
    </div>
  );
};

export default Index;