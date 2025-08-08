import React, { useEffect, useState } from 'react';
import { Shield, TrendingUp, Users, FileText, Phone, Mail, CheckCircle } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const Index = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Site Header */}
      <Header />
      {/* Hero Section */}
      
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-400 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-blue-600 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-blue-300 rounded-full animate-bounce delay-500"></div>
        </div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-12 rounded-2xl shadow-2xl max-w-4xl mx-auto backdrop-blur-sm">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
                Life Insurance
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 leading-relaxed">
                64% of Americans aged 58 and older die without life insurance and plunge their families into financial catastrophe.
              </p>
              <div className="mt-8 inline-flex items-center space-x-2 text-blue-200">
                <Shield className="w-6 h-6 animate-pulse" />
                <span className="text-lg">Protect Your Family's Future</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating icons */}
        <div className="absolute top-1/4 right-10 animate-bounce delay-300">
          <Shield className="w-12 h-12 text-blue-400 opacity-60" />
        </div>
        <div className="absolute bottom-1/3 left-10 animate-bounce delay-700">
          <TrendingUp className="w-10 h-10 text-blue-500 opacity-60" />
        </div>
      </section>

      {/* Financial Planning Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-6">
                Secure Your Financial Future
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                A solid financial plan safeguards both your income and assets. In the event of a serious illness, the financial consequences for your business and family could be severe without proper planning.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                The thought of your own death can be scary. But what's even scarier is the thought of what would happen to your business and your family if you died or were incapacitated.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                Life is unpredictable, and none of us can escape its inevitable twists and turns. But with the right life insurance coverage, you can shield your business (employees) and loved ones from the nightmares that keep you awake at night.
              </p>
              <div className="flex items-center space-x-3 text-blue-600 mt-6">
                <CheckCircle className="w-6 h-6" />
                <span className="font-semibold">Professional Financial Planning</span>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-8 rounded-2xl shadow-xl">
                <div className="bg-white p-6 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300">
                  <Users className="w-16 h-16 text-blue-600 mb-4 mx-auto" />
                  <h3 className="text-xl font-bold text-blue-900 text-center mb-3">Family Protection</h3>
                  <p className="text-gray-600 text-center">Ensuring your loved ones are financially secure</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is Life Insurance Section */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-blue-900 text-center mb-12 animate-fade-in">
              What is Life Insurance?
            </h2>
            
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  As a business owner, your employees depend on you for their livelihood. Your family also depends on you. A life insurance policy can help protect your business and legacy in the event of an unexpected event where you can no longer work as you used to, ensuring that your business will not close down and your family will be taken care of financially.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  Life insurance is a special contract you make with a trusted insurance company. The insurance company will pay a benefit to keep your business running. The amount of the benefit is typically based on your age, health, and the amount of coverage that you choose.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  I am ready to help you choose the best coverage policy and products that will not eat into your business assets, but instead, augment them and prove to be a viable investment in the long run.
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 rounded-2xl shadow-lg text-white">
                <h3 className="text-2xl font-bold mb-4 flex items-center">
                  <Shield className="w-8 h-8 mr-3" />
                  Critical Questions to Consider
                </h3>
                <p className="text-blue-100 text-lg leading-relaxed mb-6">
                  If you were diagnosed with a chronic, critical or terminal illness, how long would your savings last? What will happen to your business? How would you cover the costs? Would you resort to using credit cards or withdrawing from your 401k? What would happen to your plans for a comfortable retirement? Fortunately, there is a solution to this potential financial problem.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <TrendingUp className="w-12 h-12 text-blue-600 mb-4" />
                  <h4 className="text-xl font-bold text-blue-900 mb-3">Business Protection</h4>
                  <p className="text-gray-700">
                    If you had taken a business loan with your personal assets as collateral, life insurance can protect your family from losing those assets. Your business can get the necessary capital to keep it running.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <Users className="w-12 h-12 text-blue-600 mb-4" />
                  <h4 className="text-xl font-bold text-blue-900 mb-3">Family Support</h4>
                  <p className="text-gray-700">
                    Life insurance is also important if your families rely on your income. It can provide them financial support and maintain their lifestyle.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 p-8 rounded-2xl border-l-4 border-blue-600">
                <h4 className="text-xl font-bold text-blue-900 mb-4">Additional Benefits</h4>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                    <span>You can combine life insurance with a buy-sell agreement in partnerships. A buy-out plan allows surviving partners to buy out the deceased partner's share using life insurance benefits.</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                    <span>You can use life insurance as "key person insurance" to provide resources for replacing an essential employee who passes on.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Policy Selection Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-8">
              Which Life Insurance Policy is Best for You?
            </h2>
            
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-8 rounded-2xl mb-12">
              <p className="text-xl text-gray-700 mb-6">
                Trust me, life insurance is not a one-size-fits-all.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                You must consider your business assets, your age, your income, your type of business, and so on.
              </p>
              <p className="text-lg text-gray-600">
                That is where I come in. I will assist you to put all these details into perspective so that you can choose the best policies for you and your business.
              </p>
            </div>

            <div className="bg-white border-2 border-blue-200 rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-blue-900 mb-6">Essential Planning Questions</h3>
              <div className="text-left space-y-4 max-w-3xl mx-auto">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">If you are the Primary Breadwinner or You contribute to your family's income, have you done your income replacement planning in case life happens?</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">If you have young kids under 18 who depend on you, have you planned for their College education?</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">If you own a Primary Home and have a balance on your mortgage, have you done your mortgage protection planning?</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">Do you have a plan in place for your family to maintain the same lifestyle in case you lose your income due to disability, illness or premature death?</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">Do you have any strategies in place where you don't have to pay taxes on your Retirement income?</p>
                </div>
              </div>
            </div>

            {/* <div className="mt-12 p-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl text-white">
              <h3 className="text-2xl font-bold mb-4">If you answered NO to any of these questions.</h3>
              <p className="text-xl text-blue-100 mb-8">
                Please click the button below to book a one on one Free consultation to learn more.
              </p>
              <button className="bg-white text-blue-800 px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-50 transition-colors duration-300 transform hover:scale-105 shadow-lg">
                Book Free Consultation
              </button>
            </div> */}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-br from-blue-900 to-blue-700">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-8">Get Started Today</h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Don't wait until it's too late. Protect your family and business with the right life insurance coverage.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <Phone className="w-12 h-12 text-blue-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Call Us</h3>
              <p className="text-blue-200">Ready to discuss your options?</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <Mail className="w-12 h-12 text-blue-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Email Us</h3>
              <p className="text-blue-200">Get detailed information</p>
            </div>
          </div>
        </div>
      </section>

      
      <Footer className="bg-blue-100" />
    </div>
  );
};

export default Index;