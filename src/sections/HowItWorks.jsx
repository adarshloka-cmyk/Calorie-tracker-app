import React from 'react';

const JOURNEY = [
  { step: 1, title: "Create Account", badge: "Register profile", color: "bg-orange-100 text-orange-600" },
  { step: 2, title: "Create Club", badge: "Name your crew", color: "bg-red-100 text-red-600" },
  { step: 3, title: "Invite Friends", badge: "Share magic links", color: "bg-brand-primary/10 text-brand-primary" },
  { step: 4, title: "Log Meals", badge: "Post daily logs", color: "bg-orange-100 text-orange-600" },
  { step: 5, title: "Climb Together", badge: "Rule the board", color: "bg-emerald-100 text-emerald-600" }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="snap-section bg-[#F8F4EF]">
      {/* Shared Container Width (1280px) */}
      <div className="w-full max-w-[1280px] mx-auto px-6 flex flex-col items-center justify-center h-full pt-16">
        
        {/* Section Header */}
        <div className="text-center mb-10">
          <span className="text-xs font-extrabold uppercase tracking-widest text-brand-primary mb-2 block font-display">
            The Journey
          </span>
          <h2 className="font-display font-black text-3xl sm:text-5xl text-brand-primary tracking-tight leading-tight">
            How It Works
          </h2>
        </div>

        {/* Stacked Journey Cards */}
        <div className="w-full max-w-[360px] flex flex-col gap-1 relative z-10">
          {JOURNEY.map((item, idx) => (
            <React.Fragment key={idx}>
              {/* Step Card */}
              <div className="bg-white border-[3px] border-brand-primary rounded-[20px] p-3.5 shadow-[4px_4px_0_0_#6D001F] flex items-center justify-between z-10 hover:-translate-y-0.5 transition-transform duration-200">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs font-black font-sans">
                    {item.step}
                  </span>
                  <span className="font-display font-extrabold text-sm text-slate-800">
                    {item.title}
                  </span>
                </div>
                <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full ${item.color}`}>
                  {item.badge}
                </span>
              </div>
              
              {/* Arrow Connector */}
              {idx < JOURNEY.length - 1 && (
                <div className="flex justify-center -my-1 z-20">
                  <div className="w-5 h-5 bg-brand-primary border-2 border-white rounded-full flex items-center justify-center text-white text-[9px] font-black font-mono">
                    ↓
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

      </div>
    </section>
  );
}
