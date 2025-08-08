import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Shield, TrendingUp, Users, ChevronRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 relative overflow-hidden">
      {/* Site Header */}
      <Header />
      {/* Background Graphics */}
      
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/5 to-cyan-400/5 rounded-full blur-3xl"></div>
      </div>

      {/* Geometric Shapes */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-32 right-20 w-16 h-16 border-2 border-blue-300/30 rotate-45 animate-spin-slow"></div>
        <div className="absolute bottom-40 left-20 w-12 h-12 bg-cyan-400/20 rotate-12 animate-bounce"></div>
        <div className="absolute top-1/3 left-1/4 w-8 h-8 bg-blue-400/30 rounded-full animate-ping"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">
            High Net Worth
            <span className="block bg-gradient-to-r from-cyan-400 to-blue-300 bg-clip-text text-transparent">
              Estate Planning
            </span>
          </h1>
          
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl text-blue-100 mb-6 font-light">
              High Net Worth Estate Planning: Protect Your Legacy
            </h2>
            <p className="text-lg md:text-xl text-blue-200 leading-relaxed">
              Ensure your wealth is protected and efficiently passed on with customized estate planning. I focus on:
            </p>
          </div>
        </header>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/10 backdrop-blur-lg border-blue-300/20 p-8 hover:bg-white/15 transition-all duration-300 group">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full mr-4 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Tax Optimization</h3>
            </div>
            <p className="text-blue-100">
              Minimizing tax burdens and avoiding probate through strategic planning
            </p>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-blue-300/20 p-8 hover:bg-white/15 transition-all duration-300 group">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full mr-4 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Asset Protection</h3>
            </div>
            <p className="text-blue-100">
              Using Irrevocable Life Insurance Trusts (ILITs) to reduce estate taxes
            </p>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-blue-300/20 p-8 hover:bg-white/15 transition-all duration-300 group">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full mr-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Legacy Protection</h3>
            </div>
            <p className="text-blue-100">
              Protecting your wealth from creditors and preserving family legacy
            </p>
          </Card>
        </div>

        {/* Call to Action Section */}
        <div className="text-center max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600/20 to-cyan-500/20 backdrop-blur-lg rounded-3xl p-12 border border-blue-300/20">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
              What if I could help you create a plan that preserves your legacy for future generations?
            </h3>
            
            {/* <Button 
              size="lg" 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold px-8 py-4 text-lg rounded-full shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 group"
            >
              Schedule A Meeting
              <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button> */}
            
            <p className="text-blue-200 mt-6 text-lg">
              Free consultation • No obligation • Confidential discussion
            </p>
          </div>
        </div>

        {/* Additional Graphics Elements */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-blue-900/50 to-transparent"></div>
      </div>
      <Footer className="bg-blue-100" />
    </div>
  );
};

export default Index;
