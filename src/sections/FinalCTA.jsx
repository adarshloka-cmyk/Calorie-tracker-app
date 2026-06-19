import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCTA = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth?mode=signup');
    }
  };

  return (
    <section className="snap-section bg-[#F8F4EF]">
      {/* Shared Container Width (1280px) */}
      <div className="w-full max-w-[1280px] mx-auto px-6 flex flex-col justify-between h-full pt-24 pb-8 relative z-10">
        
        {/* Empty push placeholder */}
        <div />

        {/* Tactile Maroon CTA Card */}
        <div className="w-full max-w-[760px] mx-auto bg-brand-primary border-[3.5px] border-brand-primary rounded-[28px] p-8 sm:p-12 shadow-[6px_6px_0_0_#400012] text-white text-center flex flex-col items-center justify-center relative overflow-hidden">
          {/* Subtle decoration background grids */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
          
          {/* Headline */}
          <h2 className="font-display font-black text-4xl sm:text-6xl text-white tracking-tight leading-[1.08] relative z-10">
            Ready to start your club?
          </h2>

          {/* Subheading */}
          <p className="font-sans text-purple-100 text-sm sm:text-lg mt-6 max-w-sm relative z-10 leading-relaxed font-bold">
            Invite friends.<br />
            Track calories.<br />
            Stay consistent together.
          </p>

          {/* Single primary button CTA */}
          <div className="mt-8 w-full sm:w-auto relative z-10">
            <Button 
              variant="secondary" 
              className="px-10 py-4 w-full sm:w-auto text-base font-extrabold bg-white text-brand-primary border-brand-primary shadow-[0_5px_0_0_#2C030F] active:translate-y-[3px] active:shadow-none hover:bg-slate-50 border-none"
              onClick={handleCTA}
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5 text-brand-primary" />
            </Button>
          </div>
        </div>

        {/* Strict minimalist footer */}
        <div className="w-full text-center border-t border-brand-primary/10 pt-6">
          <span className="text-sm font-sans font-bold text-brand-primary/50">
            Built by A.
          </span>
        </div>

      </div>
    </section>
  );
}
