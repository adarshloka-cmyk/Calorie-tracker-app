import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from './Button';
import { Menu, X } from 'lucide-react';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#F8F4EF]/95 py-4 border-b-3 border-brand-primary">
      <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between">
        
        {/* Monogram Monicker Logo */}
        <div className="flex items-center cursor-pointer group" onClick={() => navigate('/')}>
          <span className="font-display font-black text-2xl tracking-tighter text-brand-primary select-none">
            FITCLUB
          </span>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-10">
          {!user ? (
            <>
              <a href="#features" className="text-sm font-sans font-black text-brand-primary hover:text-brand-secondary transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-sm font-sans font-black text-brand-primary hover:text-brand-secondary transition-colors">
                How It Works
              </a>
            </>
          ) : (
            <>
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-sm font-sans font-black text-brand-primary hover:text-brand-secondary transition-colors cursor-pointer"
              >
                Dashboard
              </button>
              <button 
                onClick={() => navigate('/profile')}
                className="text-sm font-sans font-black text-brand-primary hover:text-brand-secondary transition-colors cursor-pointer"
              >
                Profile
              </button>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <Button 
              variant="secondary" 
              className="px-5 py-2.5 text-xs font-black"
              onClick={signOut}
            >
              Sign Out
            </Button>
          ) : (
            <>
              <Button 
                variant="ghost" 
                className="px-5 py-2 text-sm text-brand-primary font-extrabold"
                onClick={() => navigate('/auth?mode=login')}
              >
                Sign In
              </Button>
              <Button 
                variant="primary" 
                className="px-6 py-2.5 text-sm"
                onClick={() => navigate('/auth?mode=signup')}
              >
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-brand-primary p-2 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 py-6 px-6 bg-[#F8F4EF] border-b-3 border-brand-primary flex flex-col gap-4 shadow-xl">
          {!user ? (
            <>
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-sans font-extrabold text-brand-primary hover:text-brand-secondary transition-colors py-2.5 border-b border-brand-primary/10"
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-sans font-extrabold text-brand-primary hover:text-brand-secondary transition-colors py-2.5 border-b border-brand-primary/10"
              >
                How It Works
              </a>
              <div className="flex gap-4 mt-4">
                <Button 
                  variant="ghost" 
                  className="flex-1 py-2 text-sm hover:bg-brand-primary/5"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/auth?mode=login');
                  }}
                >
                  Sign In
                </Button>
                <Button 
                  variant="primary" 
                  className="flex-1 py-2 text-sm"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/auth?mode=signup');
                  }}
                >
                  Get Started
                </Button>
              </div>
            </>
          ) : (
            <>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/dashboard');
                }}
                className="text-left text-base font-sans font-extrabold text-brand-primary hover:text-brand-secondary transition-colors py-2.5 border-b border-brand-primary/10 cursor-pointer"
              >
                Dashboard
              </button>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/profile');
                }}
                className="text-left text-base font-sans font-extrabold text-brand-primary hover:text-brand-secondary transition-colors py-2.5 border-b border-brand-primary/10 cursor-pointer"
              >
                Profile
              </button>
              <div className="flex gap-4 mt-4">
                <Button 
                  variant="primary" 
                  className="flex-1 py-2 text-sm"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                >
                  Sign Out
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
