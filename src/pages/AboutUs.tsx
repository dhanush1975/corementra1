import { Button } from "@/components/ui/button";
import { Header } from '../components/Header';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, TrendingUp, PiggyBank, GraduationCap, FileText, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Footer } from "@/components/Footer";


const About = () => {
  const stats = [
    {
      percentage: "66%",
      description: "US adults cannot pass a basic financial literacy test.",
      icon: <GraduationCap className="h-8 w-8" />
    },
    {
      percentage: "68%",
      description: "US adults do not have a will or trust, leaving their loved ones at risk of financial and legal complications.",
      icon: <FileText className="h-8 w-8" />
    },
    {
      percentage: "50%",
      description: "US families do not have proper income protection.",
      icon: <Shield className="h-8 w-8" />
    },
    {
      percentage: "48%",
      description: "US adults do not have any retirement savings plan in place.",
      icon: <PiggyBank className="h-8 w-8" />
    }
  ];

  const services = [
    {
      title: "MAKE MONEY",
      description: "Strategic investment planning and wealth building strategies",
      icon: <TrendingUp className="h-6 w-6" />
    },
    {
      title: "SAVE MONEY",
      description: "Tax-advantaged strategies and smart saving solutions",
      icon: <PiggyBank className="h-6 w-6" />
    },
    {
      title: "GROW MONEY",
      description: "Portfolio management and long-term wealth accumulation",
      icon: <Target className="h-6 w-6" />
    },
    {
      title: "PROTECT MONEY",
      description: "Insurance solutions and estate planning protection",
      icon: <Shield className="h-6 w-6" />
    }
  ];

  const keyServices = [
    "Estate Planning: Helping you create wills and trusts to protect your family.",
    "Life Insurance with Living Benefits: Ensuring your family's financial stability.",
    "Tax-Advantaged Strategies: Maximizing wealth growth and retention.",
    "Wealth Education for Heirs: Preparing younger generations to manage and grow wealth responsibly.",
    "Defining Your Family Mission: Aligning your wealth with your values to create a lasting legacy."
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
          <div className="relative max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="animate-fade-in">
                <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200">
                  We practice what we preach
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-light text-gray-900 mb-6 leading-tight">
                  Corementra Financial Services
                </h1>
                <div className="h-1 w-20 bg-gradient-to-r from-blue-600 to-purple-600 mb-6" />
                <p className="text-xl text-gray-700 leading-relaxed mb-8">
                We help individuals and organizations confidently plan for retirement, long-term care, and legacy transfer by offering tailored financial strategies. With a focus on trust, clarity, and long-term peace of mind, my goal is to deliver exceptional results that reflect each client’s unique needs and aspirations.
                </p>
                
              </div>
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">We Help People</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {services.map((service, index) => (
                        <div key={index} className="text-center p-3 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors duration-300">
                          <div className="flex justify-center mb-2 text-blue-600">
                            {service.icon}
                          </div>
                          <h4 className="font-semibold text-sm text-gray-800">{service.title}</h4>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" />
          <div className="relative max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="animate-fade-in">
                <h2 className="text-4xl lg:text-5xl font-bold mb-8 leading-tight">
                  Our Mission is to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Empower</span>
                </h2>
                <div className="space-y-6 text-lg leading-relaxed">
                  <p>
                  At Corementra Financial Services, we're more than just financial advisors—we're dedicated partners on a mission to help families build lasting wealth and gain the knowledge they need to confidently secure their financial future.
                  </p>
                  
                  <p className="font-semibold text-blue-300">
                    We believe the greatest challenge to financial security is not a lack of opportunity, but rather 
                    a lack of financial literacy, awareness of essential financial tools, and strategic estate planning.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {stats.map((stat, index) => (
                  <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <CardContent className="p-6 text-center">
                      <div className="text-blue-400 mb-3 flex justify-center">
                        {stat.icon}
                      </div>
                      <div className="text-4xl font-bold text-white mb-3">{stat.percentage}</div>
                      <p className="text-sm text-gray-300 leading-tight">{stat.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">How We Solve These Problems</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We am here to solve these problems by addressing the alarming realities many families face today. 
                We emphasize the importance of:
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {keyServices.map((service, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-2 animate-fade-in border-l-4 border-l-blue-500" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-gray-700 leading-relaxed">{service}</p>
                    </div>
                  </CardContent>  
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Secure Your Financial Future?</h2>
            <p className="text-xl mb-8 opacity-90">
              Let us work together to create a personalized financial strategy that aligns with your goals and values.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">

              <Link to ="/book-meeting">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg">
                      Schedule a Meeting
                  </Button>
              </Link>
            </div>
          </div>
        </section>
        <Footer className="bg-blue-100" />
      </div>
    </>
  );
};

export default About;