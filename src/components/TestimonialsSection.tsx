import { useState } from "react";

export const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "Excellent service and knowledgeable advisors. Highly recommend!",
      author: "John D."
    },
    {
      quote: "Surabhi Financial helped me secure my family's financial future with their expert guidance.",
      author: "Sarah M."
    },
    {
      quote: "Professional, reliable, and always available when I need financial advice.",
      author: "Michael R."
    }
  ];

  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  return (
    <section className="py-20 bg-financial-light">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center text-financial-dark mb-16 font-inter">
          What Our Clients Say
        </h2>
        
        <div className="max-w-3xl mx-auto text-center">
          <blockquote className="text-xl text-financial-dark mb-8 leading-relaxed font-inter">
            "{testimonials[currentTestimonial].quote}"
          </blockquote>
          <cite className="text-lg font-medium text-financial-dark font-inter">
            {testimonials[currentTestimonial].author}
          </cite>
          
          {/* Testimonial dots */}
          <div className="flex justify-center space-x-3 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentTestimonial 
                    ? 'bg-financial-dark' 
                    : 'bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};