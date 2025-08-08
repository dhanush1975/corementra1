import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const ProcessSection = () => {
  const processSteps = [
    {
      title: "1. We Start with a Conversation",
      content: "We begin by getting to know you, your family, and your unique financial situation. This initial conversation helps us understand your goals, concerns, and what matters most to you."
    },
    {
      title: "2. We Explore Your Priorities",
      content: "Together, we'll identify your short-term and long-term financial priorities, whether it's saving for retirement, your children's education, or building generational wealth."
    },
    {
      title: "3. We Review Your Financial Picture",
      content: "We conduct a comprehensive review of your current financial situation, including assets, liabilities, income, expenses, and existing investment strategies.Our team conducts a thorough analysis of your current financial position, including assets, liabilities, and cash flow."
    },
    {
      title: "4. We Create a Customized Plan",
      content: "Based on our discussions and analysis, we develop a personalized financial plan tailored to your specific needs, goals, and risk tolerance.sed on our findings, we develop a personalized financial strategy tailored specifically to your needs and objectives."
    },
    {
      title: "5. We Make Decisions Together",
      content: "We present our recommendations and work with you to make informed decisions about your financial future. Every step is collaborative and transparent.We work collaboratively with you to implement the plan, ensuring you're comfortable with every decision along the way."
    },
    {
      title: "6. We Stay With You for the Long Run",
      content: "Our relationship doesn't end with the plan. We provide ongoing support, regular reviews, and adjustments as your life and goals evolve over time.Our relationship doesn't end with implementation. We provide ongoing support and adjust your plan as life changes."
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-financial-dark mb-8 font-inter">Our process</h2>
            <p className="text-lg text-financial-dark leading-relaxed max-w-3xl mx-auto font-inter">
              At CoreMentra Financial Services, we believe financial planning isn't just about numbers — it's about people, purpose, and building a life with confidence. Our 6-step process is designed to make you feel supported, understood, and empowered every step of the way.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {processSteps.map((step, index) => (
              <AccordionItem 
                key={index} 
                value={`step-${index}`}
                className="border-b border-gray-200"
              >
                <AccordionTrigger className="py-6 text-left hover:no-underline [&[data-state=open]>svg]:rotate-180">
                  <span className="text-lg font-semibold text-financial-dark font-inter">
                    {step.title}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <p className="text-gray-600 leading-relaxed font-inter">
                    {step.content}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};