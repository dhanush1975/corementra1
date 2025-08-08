import { Button } from "@/components/ui/button";
import { FileText, Shield, PiggyBank, Activity } from "lucide-react";

const FocusSection = () => {
  const pillars = [
    {
      icon: FileText,
      title: "Estate Planning",
      description: "Ensures wealth transfer, legacy preservation, and legal control over assets after death."
    },
    {
      icon: Shield,
      title: "Family Protection",
      description: "Involves life insurance and income replacement strategies to safeguard loved ones."
    },
    {
      icon: PiggyBank,
      title: "Retirement Planning",
      description: "Involves life insurance and income replacement strategies to safeguard loved ones."
    },
    {
      icon: Activity,
      title: "Health & Disability Planning",
      description: "Prepares for medical emergencies, long-term care, and loss of income due to illness or disability."
    }
  ];

  return (
    <section className="py-20 bg-financial-light">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-financial-dark mb-4 font-inter">Our Focus</h2>
          <div className="w-16 h-1 bg-financial-gold mx-auto mb-6"></div>
          <p className="text-lg text-gray-600 font-inter">The four pillars of financial planning</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {pillars.map((pillar, index) => {
            const IconComponent = pillar.icon;
            return (
              <div key={index} className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow text-center">
                <div className="flex items-center justify-center mb-6">
                  <IconComponent className="w-12 h-12 text-blue-600" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold text-financial-dark mb-4 font-inter">
                  {pillar.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed font-inter">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        
      </div>
    </section>
  );
};

export default FocusSection;
