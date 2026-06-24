import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OperationalSurface } from '../ui/OperationalSurface';

export function HomePartners() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Properties');

  const tabs = ['Properties', 'Hospitality', 'Venues', 'Brands', 'Civic'];

  return (
    <section id="partners" className="py-[120px] px-6 md:px-12 bg-[#0B1F33] text-white w-full border-b border-[rgba(11,31,51,0.08)]">
       <div className="max-w-[1200px] mx-auto w-full">
          <div className="mb-16 md:mb-24">
             <h2 className="font-serif text-[38px] md:text-[56px] lg:text-[72px] leading-[1.1] mb-6 overflow-wrap-anywhere min-w-0">
                Turn residents into regulars.
             </h2>
             <p className="text-[15px] md:text-[18px] leading-[1.6] text-white/70 max-w-[600px] overflow-wrap-anywhere min-w-0">
                People are already downtown. Already walking. Already deciding.
                <br/><br/>
                You don't need more attention. You need better timing. This is that moment.
             </p>
          </div>

          {/* Bridge Rail */}
          <div className="flex overflow-x-auto snap-x hide-scrollbar mb-16 border-b border-white/20">
             {tabs.map((t) => (
               <button 
                 key={t}
                 onClick={() => setActiveTab(t)}
                 className={`shrink-0 snap-start px-6 py-4 text-[13px] uppercase tracking-[0.1em] font-medium transition-colors ${activeTab === t ? 'text-[#C5A028] border-b-2 border-[#C5A028]' : 'text-white/50 hover:text-white'}`}
               >
                 {t}
               </button>
             ))}
          </div>

          {/* Spotlight - Properties Default */}
          <div className="flex flex-col md:flex-row gap-16 items-start">
             <div className="w-full md:w-1/2">
                <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#C5A028] mb-6">Model: PROPERTIES</div>
                <h3 className="text-[24px] md:text-[30px] leading-[1.3] mb-6">
                   Here's the thing nobody tells you about renting apartments:
                   <br/><br/>
                   You're not selling square footage. You're selling everything around it.
                </h3>
                <p className="text-[15px] leading-[1.6] text-white/70 mb-10">
                   Give people a way to see it — not a laminated list from 2019.
                </p>

                <ul className="space-y-4 mb-10 text-[15px] text-white/80">
                   <li className="flex gap-4 items-start"><span className="text-[#C5A028] mt-1">●</span> QR access across the lobby and leasing flow</li>
                   <li className="flex gap-4 items-start"><span className="text-[#C5A028] mt-1">●</span> Live map of nearby places, events, and perks</li>
                   <li className="flex gap-4 items-start"><span className="text-[#C5A028] mt-1">●</span> Your property integrated into the local experience</li>
                   <li className="flex gap-4 items-start"><span className="text-[#C5A028] mt-1">●</span> Real engagement, not passive information</li>
                </ul>

                <button onClick={() => navigate('/admin')} className="w-full sm:w-auto px-8 py-4 bg-white text-[#0B1F33] text-[15px] font-medium hover:bg-slate-100 transition-colors">
                   Bring this to your property
                </button>
             </div>
             
             <div className="w-full md:w-1/2 bg-[#132238] aspect-[4/3] border border-white/10 flex items-center justify-center relative p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(197,160,40,0.1),transparent_70%)]" />
                <div className="w-full max-w-[320px] bg-[#0B1F33] border border-white/20 p-6 shadow-2xl relative z-10 flex flex-col gap-4">
                   <div className="h-6 w-1/3 bg-white/10" />
                   <div className="h-4 w-3/4 bg-white/5" />
                   <div className="h-4 w-1/2 bg-white/5" />
                   <div className="mt-4 h-[120px] w-full bg-white/5 flex items-center justify-center border border-white/10">
                      <div className="w-12 h-12 rounded-full border border-[#C5A028]/30 flex items-center justify-center">
                         <div className="w-4 h-4 rounded-full bg-[#C5A028]" />
                      </div>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </section>
  );
}

export function HomePricing() {
  return (
    <section className="py-[120px] px-6 md:px-12 bg-[#F1F3F7] w-full border-b border-[rgba(11,31,51,0.08)]">
       <div className="max-w-[1200px] mx-auto w-full">
          <div className="text-center mb-16">
             <h2 className="font-serif text-[38px] md:text-[56px] text-[#0B1F33] mb-6 leading-[1.1]">Pricing & Access</h2>
             <p className="text-[18px] md:text-[24px] text-[rgba(11,31,51,0.62)] max-w-[600px] mx-auto">
                90-day pilot then choose your level. Management pays. Residents stay.
             </p>
             <div className="mt-8 text-[13px] font-medium text-[#0B1F33] px-4 py-2 border border-[rgba(11,31,51,0.08)] bg-white inline-block">
                Integration: Instant — No engineering required
             </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
             <OperationalSurface className="p-8 md:p-10 flex flex-col items-center text-center bg-transparent">
                <div className="text-[20px] md:text-[24px] text-[#0B1F33] mb-2 font-medium">Free Forever</div>
                <div className="text-[13px] text-[rgba(11,31,51,0.62)] mb-8">Basic insights · $0</div>
                <button className="w-full px-6 py-3 bg-transparent border border-[rgba(11,31,51,0.08)] text-[#0B1F33] text-[13px] font-medium hover:bg-[#F1F3F7] mt-auto">Start Free</button>
             </OperationalSurface>
             
             <div className="bg-[#0B1F33] p-8 md:p-10 border border-[#0B1F33] flex flex-col items-center text-center text-white">
                <div className="text-[20px] md:text-[24px] mb-2 font-medium">Analytics</div>
                <div className="text-[13px] text-white/70 mb-8">Core reporting · $39/year</div>
                <button className="w-full px-6 py-3 bg-[#C5A028] text-[#0B1F33] text-[13px] font-medium hover:bg-[#A88718] mt-auto">Start Pilot</button>
             </div>
             
             <OperationalSurface className="p-8 md:p-10 flex flex-col items-center text-center bg-transparent">
                <div className="text-[20px] md:text-[24px] text-[#0B1F33] mb-2 font-medium">Full Stack</div>
                <div className="text-[13px] text-[rgba(11,31,51,0.62)] mb-8">Premium features · $99/year</div>
                <button className="w-full px-6 py-3 bg-transparent border border-[rgba(11,31,51,0.08)] text-[#0B1F33] text-[13px] font-medium hover:bg-[#F1F3F7] mt-auto">Choose Stack</button>
             </OperationalSurface>
          </div>
       </div>
    </section>
  );
}

export function HomeRollout() {
  const steps = [
    { n: '01', t: 'Launch', d: 'Choose the partner type, set the entry points, and go live quickly with the right map visibility.' },
    { n: '02', t: 'Measure', d: 'Track scans, saves, visits, RSVPs, redemptions, and source performance in the same system.' },
    { n: '03', t: 'Adjust', d: 'Tune placement, offers, timing, and activation windows based on what is actually working.' },
    { n: '04', t: 'Scale', d: 'Keep the pilot, expand the footprint, and move into a wider annual model with real data behind it.' },
  ];

  return (
    <section className="py-[120px] px-6 md:px-12 bg-[#FFFFFF] w-full border-b border-[rgba(11,31,51,0.08)]">
       <div className="max-w-[1200px] mx-auto w-full">
          <div className="mb-16 md:mb-24">
             <h2 className="font-serif text-[38px] md:text-[56px] text-[#0B1F33] mb-6 leading-[1.1]">Rollout path</h2>
             <p className="text-[18px] md:text-[24px] text-[rgba(11,31,51,0.62)] max-w-[800px]">
                A continuous loop from pilot to scale. Start fast, measure real actions, and scale only what works.
             </p>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-0 relative">
             {/* Desktop Timeline Rail */}
             <div className="hidden md:block absolute top-[28px] left-0 w-full h-[1px] bg-[rgba(11,31,51,0.08)]" />
             
             {steps.map((s, idx) => (
                <div key={idx} className="w-full relative pt-0 md:pt-14 border-l border-[rgba(11,31,51,0.08)] md:border-l-0 pl-6 md:pl-0 pb-10 md:pb-0 pr-6">
                   <div className="hidden md:block absolute top-[21px] left-0 w-4 h-4 rounded-full bg-white border-2 border-[#0B1F33]" />
                   <div className="md:hidden absolute top-0 -left-[2px] w-4 h-4 rounded-full bg-white border-2 border-[#0B1F33] translate-x-[-50%] mt-1" />
                   
                   <div className="text-[12px] font-mono text-[#0B1F33] mb-4">Step {s.n}</div>
                   <h4 className="text-[20px] md:text-[24px] text-[#0B1F33] mb-4">{s.t}</h4>
                   <p className="text-[15px] text-[rgba(11,31,51,0.62)] leading-[1.6]">{s.d}</p>
                </div>
             ))}
          </div>
       </div>
    </section>
  );
}

export function HomeIncluded() {
  const items = [
    { t: 'Map Listing', d: 'Show up on the live map so people can find you easily.' },
    { t: 'Custom Links & QRs', d: 'Entry points tied to real sources — lobby, leasing, counters, events.' },
    { t: 'Simple Stats', d: "See what's being opened, saved, and used — without digging." },
    { t: 'Your Dashboard + Support', d: 'Update what\'s live and get help when you need it.' }
  ];

  return (
    <section className="py-[120px] px-6 md:px-12 bg-[#F7F8FB] w-full border-b border-[rgba(11,31,51,0.08)]">
       <div className="max-w-[1200px] mx-auto w-full">
          <div className="text-center mb-16 md:mb-24">
             <h2 className="font-serif text-[38px] md:text-[56px] text-[#0B1F33] mb-6 leading-[1.1]">What's Included</h2>
             <p className="text-[18px] md:text-[24px] text-[rgba(11,31,51,0.62)] max-w-[600px] mx-auto">
                Everything you need to run your program. Connect your location to the rest of downtown easily.
             </p>
          </div>

          <div className="flex overflow-x-auto snap-x hide-scrollbar md:grid md:grid-cols-4 gap-6 pb-4 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0">
             {items.map((item, idx) => (
                <OperationalSurface key={idx} className="w-[85%] md:w-full shrink-0 snap-start p-8 md:p-10 bg-transparent flex flex-col justify-start">
                   <h4 className="text-[18px] md:text-[20px] text-[#0B1F33] mb-4 font-medium">{item.t}</h4>
                   <p className="text-[15px] text-[rgba(11,31,51,0.62)] leading-[1.6]">
                     {item.d}
                   </p>
                </OperationalSurface>
             ))}
          </div>
       </div>
    </section>
  );
}
