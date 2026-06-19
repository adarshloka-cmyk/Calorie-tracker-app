import Card from '../components/ui/Card';
import { Users, Trophy, Flame } from 'lucide-react';

const BENEFITS = [
  {
    icon: Users,
    title: "Daily Accountability",
    description: "Friends see your logs and keep you honest."
  },
  {
    icon: Trophy,
    title: "Friendly Competition",
    description: "Compete on consistency instead of restriction."
  },
  {
    icon: Flame,
    title: "Streak Multipliers",
    description: "Build momentum through daily participation."
  }
];

export default function Features() {
  return (
    <section id="features" className="snap-section bg-[#F8F4EF]">
      {/* Shared Container Width (1280px) */}
      <div className="w-full max-w-[1280px] mx-auto px-6 flex flex-col items-center justify-center h-full pt-16">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-extrabold uppercase tracking-widest text-brand-primary mb-3 block font-display">
            Core Benefits
          </span>
          <h2 className="font-display font-black text-3xl sm:text-5xl text-brand-primary tracking-tight leading-tight">
            Accountability made fun.
          </h2>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-[960px]">
          {BENEFITS.map((benefit, idx) => (
            <Card key={idx} className="flex flex-col items-start bg-white group p-7 rounded-[22px] shadow-[4px_4px_0_0_#6D001F] border-[3px] border-brand-primary">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border-2 border-brand-primary flex items-center justify-center text-brand-primary mb-5 shadow-sm shadow-brand-primary/5">
                <benefit.icon className="w-5 h-5" />
              </div>
              <h3 className="font-display font-extrabold text-lg text-brand-primary mb-2">
                {benefit.title}
              </h3>
              <p className="font-sans text-brand-text text-sm leading-relaxed font-bold">
                {benefit.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
