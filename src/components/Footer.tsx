import { Instagram, Linkedin, Facebook, Twitter } from "lucide-react";

interface FooterProps {
  className?: string;
}

export const Footer = ({ className = "" }: FooterProps) => {
  return (
    <footer className={`bg-blue-900 text-white py-12 w-full ${className}`}>
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <p className="text-sm opacity-90 mb-2 font-inter">© 2025 Corementra.</p>
            <p className="text-sm opacity-90 font-inter">All rights reserved.</p>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="font-semibold mb-4 font-inter">Contact information</h3>
            <div className="space-y-2 text-sm opacity-90 font-inter">
              <a href="mailto:contact@corementra.com" className="hover:underline">contact@corementra.com</a>
              <p>(213) 308-4003</p>
            </div>
          </div>

          {/* Social Media */}
          <div>
  <h3 className="font-semibold mb-4 font-inter">Contact us</h3>
  <div className="flex space-x-4">
    <a
      href="https://www.facebook.com/profile.php?id=61578861136963"
      target="_blank"
      rel="noopener noreferrer"
      className="p-2 hover:bg-white/10 rounded transition-colors"
    >
      <Facebook className="w-5 h-5" />
    </a>
    {/* <a
      href="https://www.twitter.com/yourhandle"
      target="_blank"
      rel="noopener noreferrer"
      className="p-2 hover:bg-white/10 rounded transition-colors"
    >
      <Twitter className="w-5 h-5" />
    </a> */}
    <a
      href="https://www.instagram.com/corementra/"
      target="_blank"
      rel="noopener noreferrer"
      className="p-2 hover:bg-white/10 rounded transition-colors"
    >
      <Instagram className="w-5 h-5" />
    </a>
    <a
      href="www.linkedin.com/in/corementra"
      target="_blank"
      rel="noopener noreferrer"
      className="p-2 hover:bg-white/10 rounded transition-colors"
    >
      <Linkedin className="w-5 h-5" />
    </a>
  </div>
</div>
        </div>
      </div>
    </footer>
  );
};