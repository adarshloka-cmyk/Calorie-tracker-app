export default function SocialCanvas() {
  return (
    <section className="snap-section bg-[#F8F4EF]">
      {/* Background spotlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[400px] rounded-full bg-orange-100/20 blur-[120px] pointer-events-none" />

      {/* Container */}
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 flex flex-col items-center justify-center h-auto md:h-full">

        {/* Section Header */}
        <div className="text-center mb-6 md:mb-14">
          <span className="text-xs font-extrabold uppercase tracking-widest text-brand-primary mb-2 block font-display">
            Why FitClub
          </span>
          <h2 className="font-display font-black text-3xl sm:text-5xl text-brand-primary tracking-tight leading-none mb-6 md:mb-12">
            Friends competing together.
          </h2>

          {/* Three clean value lines */}
          <div className="flex flex-col gap-6 max-w-lg mx-auto text-left">
            <div className="flex items-start gap-4">
              <span className="font-mono font-black text-brand-accent text-base mt-0.5 shrink-0">01</span>
              <div>
                <p className="font-display font-black text-xl text-brand-primary leading-tight">Track calories with friends.</p>
                <p className="text-sm font-bold text-brand-primary/55 mt-1">Log every meal, see what your club is eating in real time.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="font-mono font-black text-brand-accent text-base mt-0.5 shrink-0">02</span>
              <div>
                <p className="font-display font-black text-xl text-brand-primary leading-tight">Stay accountable every day.</p>
                <p className="text-sm font-bold text-brand-primary/55 mt-1">When your name is on the leaderboard, skipping a log feels personal.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="font-mono font-black text-brand-accent text-base mt-0.5 shrink-0">03</span>
              <div>
                <p className="font-display font-black text-xl text-brand-primary leading-tight">Build consistency together.</p>
                <p className="text-sm font-bold text-brand-primary/55 mt-1">Streaks, rankings, and reactions turn habit into competition.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
