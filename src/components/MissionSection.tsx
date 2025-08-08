export const MissionSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left side - Our Mission with text inside */}
            <div className="bg-gradient-to-br from-financial-light to-white rounded-3xl p-10 shadow-xl border border-financial-gold/10">
              <h2 className="text-4xl font-bold text-financial-dark mb-6 font-inter">Our Mission</h2>
              <div className="w-16 h-1 bg-financial-gold rounded-full mb-6"></div>
              <p className="text-lg text-financial-dark leading-relaxed font-inter">
                <span className="text-financial-gold font-semibold">Empowering families</span> to build generational wealth and take control of their financial future — with a commitment that{' '}
                <span className="text-purple-600 font-semibold">no family is ever left behind</span>.
              </p>
            </div>

            {/* Right side - Insurance Offer Box */}
            <div className="bg-gradient-to-br from-financial-light to-white border border-financial-gold/10 rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-300">               
  <div className="text-center space-y-6">                 
    <h3 className="text-2xl font-bold text-financial-dark font-inter">                   
      Get instant insurance from CoreMentra                 
    </h3>                 
    <p className="text-gray-600 font-inter">                   
      Quick quotes, competitive rates, trusted coverage.              
    </p>                 
    <button                    
      onClick={() => window.open('https://agents.ethoslife.com/invite/efb422', '_blank')}                   
      className="bg-financial-gold text-white px-8 py-4 rounded-lg font-semibold hover:bg-financial-gold/90 hover:scale-105 transition-all duration-300 shadow-lg font-inter text-lg"                 
    >                     
      Get My Rates                 
    </button>               
  </div>             
</div>
          </div>
        </div>
      </div>
    </section>
  );
};