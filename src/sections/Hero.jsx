import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePrimaryClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth?mode=signup');
    }
  };

  const handleSecondaryClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth?mode=login');
    }
  };

  return (
    <section className="snap-section bg-[#F8F4EF]">
      {/* Container constraints (1280px) */}
      <div className="w-full max-w-[1280px] mx-auto px-6 flex flex-col items-center justify-center h-full pt-20">

        {/* Content headers */}
        <div className="max-w-3xl text-center">
          <h1 className="font-display font-black text-5xl sm:text-7xl md:text-8xl tracking-tight text-brand-primary leading-[0.98]">
            The first rule of FitClub is...<br />
            <span className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent bg-clip-text text-transparent">
              don't hide the calories.
            </span>
          </h1>

          <p className="font-sans text-brand-text text-base sm:text-xl mt-6 max-w-xl mx-auto leading-relaxed font-bold">
            Track calories with friends. Stay accountable. Win the day.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 w-full sm:w-auto">
            <Button
              variant="primary"
              className="px-8 py-3 text-sm font-bold flex items-center justify-center gap-1"
              onClick={handlePrimaryClick}
            >
              <span>Get Started</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </Button>
            <Button
              variant="secondary"
              className="px-8 py-3 text-sm font-bold"
              onClick={handleSecondaryClick}
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Bubbly Active Social Cards (-40% size to avoid vertical overflow) */}
        <div className="w-full max-w-2xl mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">

          {/* Card A: Sudeep logged Biryani */}
          <div className="w-[240px] bg-white border-[3px] border-brand-primary rounded-[22px] p-4 shadow-[4px_4px_0_0_#6D001F] text-left transform sm:-rotate-1 hover:rotate-0 hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
              <span className="text-[10px] font-black text-slate-800">Breakfast Club</span>
              <span className="text-[8px] font-bold text-brand-secondary font-mono">2m ago</span>
            </div>
            <div className="flex gap-2">
              <div className="w-6.5 h-6.5 rounded-full bg-brand-accent text-white flex items-center justify-center text-[10px] font-black shrink-0">R</div>
              <div>
                <h4 className="text-[10px] font-black text-slate-800">Rama</h4>
                <p className="text-[11px] text-slate-600 mt-0.5 font-semibold">Logged <span className="font-extrabold text-brand-primary">Biryani 🍛</span></p>
              </div>
            </div>
          </div>

          {/* Card B: Suhith reacted */}
          <div className="w-[200px] bg-white border-[3px] border-brand-primary rounded-[22px] p-4 shadow-[4px_4px_0_0_#6D001F] text-left transform sm:rotate-1 hover:rotate-0 hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex gap-2.5 items-center">
              <div className="w-6.5 h-6.5 rounded-full bg-emerald-400 text-white flex items-center justify-center text-[10px] font-black shrink-0">S</div>
              <div>
                <span className="text-[9px] text-brand-secondary font-bold block">REACTION</span>
                <p className="text-[10px] text-slate-800 font-extrabold mt-0.5">Suhith commented: <span className="text-brand-primary">Bro again? 😂</span></p>
              </div>
            </div>
          </div>

          {/* Card C: Adarsh moved to #1 */}
          <div className="w-[210px] bg-brand-primary border-[3px] border-brand-primary rounded-[22px] p-4 shadow-[4px_4px_0_0_#400012] text-left hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex gap-2.5 items-center">
              <div className="w-6.5 h-6.5 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px] font-black shrink-0">A</div>
              <div>
                <span className="text-[8px] text-white/70 font-bold block uppercase tracking-wider">Milestone</span>
                <p className="text-[10px] text-white font-extrabold mt-0.5">Adarsh moved to #1 🥇</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
