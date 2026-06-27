import React, { useState } from 'react';
import { ArrowRight, MapPin, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function HomeHeader() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Residents', href: '#join' },
    { label: 'Partners', href: '#partners' },
    { label: 'Map', href: '#map' },
    { label: 'Events', href: '#map' },
    { label: 'Perks', href: '#map' },
    { label: 'Perks Card', href: '#perks-card' },
    { label: 'About', href: '#about' }
  ];

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(href);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-[900] h-[68px] bg-[rgba(247,248,251,0.88)] backdrop-blur-[18px] border-b border-[rgba(11,31,51,0.08)] flex justify-between items-center px-4 md:px-8">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <span className="font-bold text-[18px] tracking-tight text-[#0B1F33]">Downtown Perks</span>
        </div>
        
        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((link, idx) => (
            <a 
              key={idx} 
              href={link.href} 
              onClick={(e) => handleSmoothScroll(e, link.href)}
              className="text-[#0B1F33] text-[13px] font-medium hover:text-[#C5A028] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-4">
          <button 
             onClick={() => navigate('/map?mode=resident&tab=map')}
             className="px-5 py-2.5 bg-transparent border border-[rgba(11,31,51,0.08)] text-[#0B1F33] text-[13px] font-medium hover:bg-slate-50 transition-colors"
          >
             Open map
          </button>
          <button 
             onClick={() => { const el = document.querySelector('#join'); el?.scrollIntoView({behavior: 'smooth'})}}
             className="px-5 py-2.5 bg-[#0B1F33] text-white text-[13px] font-medium hover:bg-[#132238] transition-colors"
          >
             Get your Perks Card
          </button>
        </div>

        <div className="lg:hidden flex items-center gap-3">
          <button 
             onClick={() => navigate('/map?mode=resident&tab=map')}
             className="px-4 py-2 bg-transparent border border-[rgba(11,31,51,0.08)] text-[#0B1F33] text-[12px] font-medium"
          >
             Open map
          </button>
          <button 
             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
             className="w-10 h-10 flex flex-col items-center justify-center gap-1.5"
          >
            <div className={`w-5 h-[2px] bg-[#0B1F33] transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-[8px]' : ''}`}></div>
            <div className={`w-5 h-[2px] bg-[#0B1F33] transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`}></div>
            <div className={`w-5 h-[2px] bg-[#0B1F33] transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-[8px]' : ''}`}></div>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[68px] z-[890] bg-[#F7F8FB] overflow-y-auto px-6 py-8 flex flex-col gap-6 lg:hidden">
           <div className="flex flex-col gap-4">
             {navLinks.map((link, idx) => (
               <a 
                 key={idx} 
                 href={link.href} 
                 onClick={(e) => handleSmoothScroll(e, link.href)}
                 className="text-[#0B1F33] text-[18px] font-medium border-b border-[rgba(11,31,51,0.08)] pb-4"
               >
                 {link.label}
               </a>
             ))}
           </div>
           <div className="flex flex-col gap-3 mt-4">
             <button 
               onClick={() => { setMobileMenuOpen(false); navigate('/map?mode=resident&tab=map'); }}
               className="w-full py-4 text-center bg-transparent border border-[rgba(11,31,51,0.08)] text-[#0B1F33] text-[15px] font-medium"
             >
               Open map
             </button>
             <button 
               onClick={() => { setMobileMenuOpen(false); const el = document.querySelector('#join'); el?.scrollIntoView({behavior: 'smooth'})}}
               className="w-full py-4 text-center bg-[#0B1F33] text-white text-[15px] font-medium"
             >
               Get your Perks Card
             </button>
           </div>
        </div>
      )}
    </>
  );
}

export function HomeHero() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/map?mode=resident&tab=map&query=${encodeURIComponent(query)}`);
  };

  const handleChip = (chip: string, filter: string) => {
    navigate(`/map?mode=resident&tab=map&filter=${filter}&query=${encodeURIComponent(chip)}`);
  };

  return (
    <section className="relative min-h-[calc(100dvh-68px)] flex flex-col items-center justify-center px-5 pt-[96px] pb-[56px] overflow-hidden bg-[#F7F8FB] z-10 w-full" id="about">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(11,31,51,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(11,31,51,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(197,160,40,0.08),transparent_60%)]" />

      <div className="relative z-10 w-full max-w-[760px] mx-auto flex flex-col items-center text-center">
         <span className="text-[10px] md:text-[12px] uppercase tracking-[0.1em] font-medium text-[rgba(11,31,51,0.62)] mb-6 md:mb-8">Downtown Perks</span>
         <h1 className="text-[52px] leading-[1.05] md:text-[88px] lg:text-[104px] text-[#0B1F33] mb-6 tracking-[-0.02em] text-balance break-words overflow-wrap-anywhere min-w-0">
           Where downtown meets you.
         </h1>
         <p className="text-[18px] md:text-[24px] lg:text-[30px] leading-[1.4] text-[rgba(11,31,51,0.62)] max-w-[680px] mb-12 text-balance overflow-wrap-anywhere min-w-0">
           Built for people who actually live here — and the places that make it feel like home.
           <br/><br/>
           From coffee to dinner, live events, and everything in between — plus the perks you didn't know you had. All in one place. No extra downloads. No friction or guesswork about what matters.
         </p>

         <div className="w-full max-w-[540px] mb-10">
            <form onSubmit={handleSearch} className="relative w-full flex items-center bg-white border border-[rgba(11,31,51,0.08)] p-2">
               <div className="absolute left-4 opacity-50"><Search className="w-5 h-5 text-[#0B1F33]" /></div>
               <input 
                 type="text" 
                 placeholder="Coffee near me" 
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 className="w-full py-4 pl-12 pr-32 bg-transparent text-[#0B1F33] text-[16px] placeholder:text-[rgba(11,31,51,0.4)] focus:outline-none"
               />
               <button type="submit" className="absolute right-2 px-6 py-3 bg-[#0B1F33] text-white text-[13px] font-medium hover:bg-[#132238] transition-colors">
                  Ask the map
               </button>
            </form>
         </div>

         <div className="flex w-full overflow-x-auto snap-x hide-scrollbar mb-16 pb-2 justify-center gap-3">
            {[
              {l:'Coffee', f:'Coffee'}, 
              {l:'Dinner', f:'Food'}, 
              {l:'Groceries', f:'Services'}, 
              {l:'Fitness', f:'Fitness'}, 
              {l:'Drinks', f:'Drinks'}
            ].map(c => (
              <button 
                key={c.l} 
                onClick={() => handleChip(c.l, c.f)}
                className="shrink-0 snap-start px-5 py-2.5 bg-white border border-[rgba(11,31,51,0.08)] text-[13px] text-[#0B1F33] whitespace-nowrap hover:bg-[#F1F3F7] transition-colors"
               >
                 {c.l}
               </button>
            ))}
         </div>

         <div className="flex flex-col sm:flex-row gap-4 mb-20 w-full sm:w-auto">
            <button onClick={() => navigate('/map?mode=resident&tab=map')} className="px-8 py-4 bg-[#0B1F33] text-white text-[15px] font-medium hover:bg-[#132238] transition-colors w-full sm:w-auto">
               Open map
            </button>
            <button onClick={() => navigate('/map?mode=resident&tab=map')} className="px-8 py-4 bg-transparent border border-[rgba(11,31,51,0.08)] text-[#0B1F33] text-[15px] font-medium hover:bg-[#F1F3F7] transition-colors w-full sm:w-auto">
               See what is nearby
            </button>
         </div>

         <div className="w-full flex justify-center mt-auto border-t border-[rgba(11,31,51,0.08)] pt-6">
            <div className="text-[12px] font-mono text-[rgba(11,31,51,0.62)] tracking-[0.15em] uppercase text-center w-full px-4 break-words">
               CONGRESS AVE ● RAINEY ST ● 2ND ST ● RED RIVER ● WATERLOO
            </div>
         </div>
      </div>
    </section>
  );
}

export function HomeContext() {
  return (
    <section className="py-[120px] px-6 md:px-12 bg-[#FFFFFF] w-full border-b border-[rgba(11,31,51,0.08)]">
       <div className="max-w-[760px] mx-auto w-full">
          <h2 className="text-[38px] md:text-[56px] lg:text-[72px] leading-[1.1] text-[#0B1F33] mb-8 overflow-wrap-anywhere min-w-0">
             Downtown, in one place.
          </h2>
          <div className="space-y-6 text-[15px] md:text-[18px] leading-[1.6] text-[rgba(11,31,51,0.62)] overflow-wrap-anywhere min-w-0">
             <p>
               You live downtown but expect it to be easier. Easier to navigate. Easier to connect. More useful day to day.
             </p>
             <p>
               Instead, everything you want is spread across too many places. Google for restaurants. Instagram for events. Text three friends to find the best happy hour.
             </p>
             <p>
               Downtown Perks fixes that. Because the problem isn't what to do next — it's the effort it takes to decide.
             </p>
          </div>
       </div>
    </section>
  );
}

import { OperationalSurface } from '../ui/OperationalSurface';

export function HomeSearchLess() {
  const navigate = useNavigate();
  
  return (
    <section className="py-[100px] px-6 md:px-12 bg-[#F1F3F7] w-full border-b border-[rgba(11,31,51,0.08)]">
       <div className="max-w-[1200px] mx-auto w-full flex flex-col md:flex-row gap-16 md:items-center">
          <div className="w-full md:w-1/2">
             <h2 className="text-[38px] md:text-[56px] lg:text-[64px] leading-[1.1] text-[#0B1F33] mb-6 overflow-wrap-anywhere min-w-0">
                Search less.<br/>Do more.
             </h2>
             <p className="text-[15px] md:text-[18px] leading-[1.6] text-[rgba(11,31,51,0.62)] mb-10 overflow-wrap-anywhere min-w-0">
                Places, plans, and perks in one view — so deciding what to do next takes seconds, not ten tabs.
             </p>
             <button onClick={() => navigate('/map?mode=resident&tab=map')} className="w-full md:w-auto px-8 py-4 bg-[#0B1F33] text-white text-[15px] font-medium hover:bg-[#132238] transition-colors">
                Open the map
             </button>
          </div>
          <div className="w-full md:w-1/2 flex justify-center">
             <OperationalSurface className="w-full max-w-[400px] aspect-square flex flex-col items-center justify-center relative overflow-hidden p-6 gap-4">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(197,160,40,0.1),transparent_70%)]" />
                <div className="w-[80%] h-12 bg-[#F7F8FB] border border-[rgba(11,31,51,0.08)] flex items-center px-4 z-10 rounded-[8px]">
                   <div className="w-4 h-4 rounded-full border border-[rgba(11,31,51,0.2)] mr-3" />
                   <div className="h-2 bg-[rgba(11,31,51,0.1)] w-32" />
                </div>
                <div className="w-[70%] h-12 bg-[#F7F8FB] border border-[rgba(11,31,51,0.08)] flex items-center px-4 z-10 translate-x-4 rounded-[8px]">
                   <div className="w-4 h-4 rounded-full border border-[rgba(11,31,51,0.2)] mr-3" />
                   <div className="h-2 bg-[rgba(11,31,51,0.1)] w-24" />
                </div>
                <div className="w-[85%] h-12 bg-[#F7F8FB] border border-[rgba(11,31,51,0.08)] flex items-center px-4 z-10 -translate-x-2 rounded-[8px]">
                   <div className="w-4 h-4 rounded-full border border-[rgba(11,31,51,0.2)] mr-3" />
                   <div className="h-2 bg-[rgba(11,31,51,0.1)] w-40" />
                </div>
             </OperationalSurface>
          </div>
       </div>
    </section>
  );
}
