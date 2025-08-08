import { Button } from "@/components/ui/button";

const cityImage = "/lovable-uploads/e425fe05-f9ab-4133-8c25-da29162af194.png";

const HeroSection = () => {
  return (
    <section className="relative w-full min-h-[300px] flex items-center overflow-hidden flex-shrink-0">
      {/* Animated Background Placeholder */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse" />
      
      {/* Blurred Background Image + Dark Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${cityImage})`,
          filter: "blur(2px)",
          transform: "scale(1.1)",
        }}
      />
      
      {/* Foreground Content */}
      <div className="w-full relative z-20 flex items-center justify-between">
        <div className="container mx-auto px-6 py-20 flex items-center justify-between w-full max-w-7xl">
          {/* Left Heading */}
          <div className="max-w-xl flex-shrink-0">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-inter text-white tracking-tight leading-tight drop-shadow-2xl">
              <span className="font-light">FINANCIAL</span>
              <br />
              <span className="font-bold">SERVICES</span>
            </h1>
            <p className="mt-2 text-base sm:text-lg text-gray-200 font-inter">
              Empowering your financial future with personalized planning and expert guidance.
            </p>
          </div>
          
          {/* Right Button */}
          
                       
          
        </div>
      </div>
    </section>
  );
};

export default HeroSection;