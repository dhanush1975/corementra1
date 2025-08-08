import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const Header = () => {
  return (
    <header className="w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-10 py-4">
        <nav className="flex items-center justify-between">
          {/* Company Logo */}
          <Link to="/">
            <img
               src="/logo.png"
               alt="CoreMentra Logo"
               className="h-12 cursor-pointer"
            />
          </Link>
          
          {/* Navigation Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/">
              <Button variant="nav-link" className="font-inter font-medium">
                HOME
              </Button>
            </Link>
            
            <Link to="/about">
              <Button variant="nav-link" className="font-inter font-medium">
                ABOUT
              </Button>
            </Link>
            
            <Link to="/services">
              <Button variant="nav-link" className="font-inter font-medium">
                SERVICES
              </Button>
            </Link>
            
            {/* <Link to="/contact">
              <Button variant="nav-link" className="font-inter font-medium">
                CONTACT
              </Button>
            </Link> */}
            
            <Link to="/book-meeting">
              <Button variant="financial-cta" className="font-inter">
                Book a meeting
              </Button>
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
};