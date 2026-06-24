import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { OperationalSurface } from '../ui/OperationalSurface';

export function HomeFaq() {
  const faqs = [
    { q: 'Do I need to download an app?', a: 'No extra downloads. Downtown Perks works directly through your mobile browser or as a seamless web app.' },
    { q: 'Does it cost anything for residents?', a: 'Residents pay a $25/yr fee. However, if your building is a partner, this is entirely covered by management.' },
    { q: 'Do venues pay to join?', a: 'Venues have a free foundational tier to join the map. Premium tools like analytics require a paid plan.' },
    { q: 'What do buildings pay?', a: 'Building pricing is structured around resident count and analytics needs, starting after a standard pilot phase.' },
    { q: 'How fast can a partner launch?', a: 'Instantly. Once your profile is verified, you can appear on the map and start offering perks within minutes.' },
    { q: 'What kind of perks are included?', a: 'Offers range from dining discounts and coffee upgrades to waived fees and VIP access at local properties.' },
    { q: 'How do partners update listings?', a: 'Partners receive access to a dedicated dashboard where they can update listings, manage offers, and view stats.' },
    { q: 'Can I connect with other residents?', a: 'While you can discover shared public and private events, direct resident-to-resident messaging is not the focus.' }
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="py-[120px] px-6 md:px-12 bg-[#FFFFFF] w-full border-b border-[rgba(11,31,51,0.08)]">
       <div className="max-w-[760px] mx-auto w-full">
          <div className="text-center mb-16">
             <h2 className="font-serif text-[38px] md:text-[56px] text-[#0B1F33] mb-6 leading-[1.1]">FAQ</h2>
             <p className="text-[18px] md:text-[24px] text-[rgba(11,31,51,0.62)]">
                Everything you need to know about how Downtown Perks works for residents and partners.
             </p>
          </div>

          <div className="space-y-4">
             {faqs.map((faq, idx) => (
                <div key={idx} className="border border-[rgba(11,31,51,0.08)] bg-[#F7F8FB]">
                   <button 
                     onClick={() => toggleFaq(idx)}
                     aria-expanded={openIdx === idx}
                     className="w-full px-6 py-5 flex justify-between items-center text-left focus:outline-none focus:ring-2 focus:ring-[#0B1F33]"
                   >
                      <span className="text-[15px] md:text-[16px] font-medium text-[#0B1F33]">{faq.q}</span>
                      <ChevronDown className={`w-5 h-5 text-[rgba(11,31,51,0.4)] transition-transform ${openIdx === idx ? 'rotate-180' : ''}`} />
                   </button>
                   {openIdx === idx && (
                      <div className="px-6 pb-6 pt-0 text-[15px] text-[rgba(11,31,51,0.62)] leading-[1.6]">
                         {faq.a}
                      </div>
                   )}
                </div>
             ))}
          </div>
       </div>
    </section>
  );
}

export function HomeJoin() {
  const navigate = useNavigate();

  return (
    <section id="join" className="py-[120px] px-6 md:px-12 bg-[#F1F3F7] w-full border-b border-[rgba(11,31,51,0.08)]">
       <div className="max-w-[1200px] mx-auto w-full">
          <div className="text-center mb-16 md:mb-24">
             <h2 className="font-serif text-[38px] md:text-[56px] text-[#0B1F33] mb-6 leading-[1.1]">Ready when you are.</h2>
             <p className="text-[18px] md:text-[24px] text-[rgba(11,31,51,0.62)] max-w-[600px] mx-auto">
                People choose what's clear and easy to act on. Select who you are so we can guide you to the right setup.
             </p>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
             {/* Path A */}
             <OperationalSurface className="w-full md:w-1/2 p-8 md:p-12 flex flex-col items-start relative overflow-hidden bg-transparent">
                <div className="absolute top-0 right-0 p-8 text-[rgba(11,31,51,0.04)] font-serif text-[120px] leading-none pointer-events-none select-none">R</div>
                
                <h3 className="text-[24px] md:text-[30px] font-medium text-[#0B1F33] mb-6 relative z-10">I'm a resident</h3>
                <p className="text-[15px] md:text-[16px] text-[rgba(11,31,51,0.62)] leading-[1.6] mb-8 relative z-10">
                   Check if your building is already connected. If it is, you can activate your Perks Card instantly. If not, you can still join and start exploring.
                </p>
                <div className="bg-[#F7F8FB] p-6 border border-[rgba(11,31,51,0.08)] mb-8 w-full relative z-10">
                   <p className="text-[13px] text-[rgba(11,31,51,0.62)] leading-[1.6]">
                     Pay a one-time $25 fee to activate your Perks Card. If your building joins later, that fee is fully refunded.
                   </p>
                </div>
                
                <ul className="space-y-4 mb-10 text-[13px] font-medium text-[#0B1F33] relative z-10">
                   <li className="flex gap-3 items-center"><span className="w-1.5 h-1.5 rounded-full bg-[#C5A028]" /> Search your building name</li>
                   <li className="flex gap-3 items-center"><span className="w-1.5 h-1.5 rounded-full bg-[#C5A028]" /> If found → activate your card</li>
                   <li className="flex gap-3 items-center"><span className="w-1.5 h-1.5 rounded-full bg-[#C5A028]" /> If not → sign up and request your building</li>
                </ul>

                <button onClick={() => navigate('/map?mode=resident')} className="px-8 py-4 bg-[#0B1F33] text-white text-[15px] font-medium hover:bg-[#132238] transition-colors mt-auto flex items-center gap-3 relative z-10 w-full sm:w-auto justify-center">
                   Check your building <ArrowRight className="w-4 h-4" />
                </button>
             </OperationalSurface>

             {/* Path B */}
             <div className="w-full md:w-1/2 bg-[#0B1F33] text-white p-8 md:p-12 border border-[#0B1F33] flex flex-col items-start relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-white/5 font-serif text-[120px] leading-none pointer-events-none select-none">P</div>
                
                <h3 className="text-[24px] md:text-[30px] font-medium mb-6 relative z-10">I'm a partner</h3>
                <p className="text-[15px] md:text-[16px] text-white/70 leading-[1.6] mb-8 relative z-10">
                   Choose your partner type and set up your presence on the map.
                </p>
                
                <div className="flex flex-wrap gap-3 mb-8 relative z-10">
                   <div className="px-4 py-2 border border-white/20 bg-white/5 text-[13px] font-medium">Property / Building</div>
                   <div className="px-4 py-2 border border-white/20 bg-white/5 text-[13px] font-medium">Venue / Local Business</div>
                   <div className="px-4 py-2 border border-white/20 bg-white/5 text-[13px] font-medium">Brand / Sponsor</div>
                   <div className="px-4 py-2 border border-white/20 bg-white/5 text-[13px] font-medium">Civic / Community</div>
                </div>

                <div className="mb-8 w-full relative z-10">
                   <p className="text-[13px] text-white/50 leading-[1.6]">
                     We'll guide you through the right form based on your selection, with only the fields you need.
                   </p>
                </div>
                
                <ul className="space-y-4 mb-10 text-[13px] font-medium text-white/90 relative z-10">
                   <li className="flex gap-3 items-center"><span className="w-1.5 h-1.5 rounded-full bg-[#C5A028]" /> Select your partner type</li>
                   <li className="flex gap-3 items-center"><span className="w-1.5 h-1.5 rounded-full bg-[#C5A028]" /> Add your location and details</li>
                   <li className="flex gap-3 items-center"><span className="w-1.5 h-1.5 rounded-full bg-[#C5A028]" /> Publish to the map</li>
                </ul>

                <button onClick={() => navigate('/admin')} className="px-8 py-4 bg-white text-[#0B1F33] text-[15px] font-medium hover:bg-slate-100 transition-colors mt-auto flex items-center gap-3 relative z-10 w-full sm:w-auto justify-center">
                   Get started <ArrowRight className="w-4 h-4" />
                </button>
             </div>
          </div>
       </div>
    </section>
  );
}

export function HomeFooter() {
  const navigate = useNavigate();

  return (
    <footer className="py-[100px] px-6 md:px-12 bg-[#0B1F33] text-white w-full">
       <div className="max-w-[1200px] mx-auto w-full">
          <div className="flex flex-col lg:flex-row gap-16 lg:gap-[120px] mb-24">
             
             <div className="lg:w-[400px]">
                <div className="font-bold text-[18px] tracking-tight mb-6">Downtown Perks</div>
                <p className="text-[15px] text-white/70 leading-[1.6]">
                   A live neighborhood layer for downtown Austin — connecting residents, buildings, and local businesses through a shared interface and real-time intelligence.
                </p>
             </div>
             
             <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-10">
                <div className="flex flex-col gap-4">
                   <div className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#C5A028] mb-2">Explore</div>
                   <button onClick={() => navigate('/map?mode=resident&tab=map')} className="text-[13px] text-white/70 hover:text-white transition-colors text-left">Live Map</button>
                   <button onClick={() => navigate('/map?mode=resident&tab=events')} className="text-[13px] text-white/70 hover:text-white transition-colors text-left">Events</button>
                   <button onClick={() => navigate('/map?mode=resident&tab=saved')} className="text-[13px] text-white/70 hover:text-white transition-colors text-left">Perks</button>
                   <button onClick={() => document.querySelector('#join')?.scrollIntoView()} className="text-[13px] text-white/70 hover:text-white transition-colors text-left">Perks Card</button>
                   <button onClick={() => document.querySelector('#about')?.scrollIntoView()} className="text-[13px] text-white/70 hover:text-white transition-colors text-left">About</button>
                </div>

                <div className="flex flex-col gap-4">
                   <div className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#C5A028] mb-2">Partners</div>
                   <button onClick={() => document.querySelector('#partners')?.scrollIntoView()} className="text-[13px] text-white/70 hover:text-white transition-colors text-left">Properties</button>
                   <button onClick={() => document.querySelector('#partners')?.scrollIntoView()} className="text-[13px] text-white/70 hover:text-white transition-colors text-left">Hotels</button>
                   <button onClick={() => document.querySelector('#partners')?.scrollIntoView()} className="text-[13px] text-white/70 hover:text-white transition-colors text-left">Venues</button>
                   <button onClick={() => document.querySelector('#partners')?.scrollIntoView()} className="text-[13px] text-white/70 hover:text-white transition-colors text-left">Brands</button>
                   <button onClick={() => document.querySelector('#partners')?.scrollIntoView()} className="text-[13px] text-white/70 hover:text-white transition-colors text-left">Civic</button>
                </div>

                <div className="flex flex-col gap-4 col-span-2 lg:col-span-1">
                   <div className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#C5A028] mb-2">Platform</div>
                   <button onClick={() => document.querySelector('#partners')?.scrollIntoView()} className="text-[13px] text-white/70 hover:text-white transition-colors text-left">Partner Overview</button>
                   <button onClick={() => navigate('/admin')} className="text-[13px] text-white/70 hover:text-white transition-colors text-left">Partner Workspace</button>
                   <button onClick={() => navigate('/admin/dashboard')} className="text-[13px] text-white/70 hover:text-white transition-colors text-left">Dashboard</button>
                   <button onClick={() => navigate('/admin')} className="text-[13px] text-white/70 hover:text-white transition-colors text-left">Start Here</button>
                   <button onClick={() => navigate('/map')} className="text-[13px] text-white/70 hover:text-white transition-colors text-left">Brand Directory</button>
                </div>
             </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[13px] text-white/50">
             <div>© 2026 Downtown Perks · Austin, TX · 78701</div>
             <div>Where downtown meets you.</div>
          </div>
       </div>
    </footer>
  );
}
