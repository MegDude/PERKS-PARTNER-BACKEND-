import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Smartphone, Scan, ArrowRight } from 'lucide-react';
import { OperationalSurface } from '../ui/OperationalSurface';

export function HomeLiveMap() {
  const navigate = useNavigate();

  return (
    <section id="map" className="py-[120px] px-6 md:px-12 bg-[#F7F8FB] w-full border-b border-[rgba(11,31,51,0.08)]">
       <div className="max-w-[1200px] mx-auto w-full text-center flex flex-col items-center">
          <span className="text-[10px] md:text-[12px] uppercase tracking-[0.1em] font-medium text-[#C5A028] mb-4">Happening now</span>
          <h2 className="font-serif text-[38px] md:text-[56px] lg:text-[72px] leading-[1.1] text-[#0B1F33] mb-6 overflow-wrap-anywhere min-w-0">
             See what's nearby.
          </h2>
          <p className="text-[15px] md:text-[18px] leading-[1.6] text-[rgba(11,31,51,0.62)] mb-10 max-w-[600px] overflow-wrap-anywhere min-w-0">
             Explore the map to find active events, special deals, and local perks right around the corner.
          </p>
          <button onClick={() => navigate('/map?mode=resident&tab=map')} className="px-8 py-4 bg-[#0B1F33] text-white text-[15px] font-medium hover:bg-[#132238] transition-colors mb-16">
             Open the map
          </button>

          <OperationalSurface className="grid w-full gap-0 overflow-hidden bg-white text-left md:grid-cols-3">
             {[
                {
                  icon: MapPin,
                  title: 'Live places',
                  body: 'Open the real map to browse nearby venues, properties, hotels, civic programs, and services.',
                },
                {
                  icon: Smartphone,
                  title: 'Resident actions',
                  body: 'Save places, open directions, view perks, and move from discovery to a real decision.',
                },
                {
                  icon: Scan,
                  title: 'Tracked engagement',
                  body: 'Map actions connect back to scans, redemptions, events, partner reporting, and platform activity.',
                },
             ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => navigate('/map?mode=resident&tab=map')}
                    className="group flex min-h-[220px] flex-col justify-between border-b border-[rgba(11,31,51,0.08)] bg-white p-8 text-left transition-colors hover:border-[#C8A96A] md:border-b-0 md:border-r last:border-r-0"
                  >
                    <Icon className="h-5 w-5 text-[#C8A96A]" />
                    <div>
                      <h3 className="mb-3 text-[24px] font-semibold leading-tight text-[#0B1F33]">{item.title}</h3>
                      <p className="text-[15px] leading-6 text-[rgba(11,31,51,0.62)]">{item.body}</p>
                    </div>
                    <span className="mt-8 inline-flex items-center gap-2 text-[12px] font-semibold text-[#0B1F33]">
                      Open real map <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </button>
                );
             })}
          </OperationalSurface>
       </div>
    </section>
  );
}

export function HomeHowItWorks() {
  return (
    <section className="py-[120px] px-6 md:px-12 bg-[#FFFFFF] w-full border-b border-[rgba(11,31,51,0.08)]">
       <div className="max-w-[1200px] mx-auto w-full">
          <div className="mb-16 md:mb-20">
             <h2 className="font-serif text-[38px] md:text-[56px] lg:text-[72px] leading-[1.1] text-[#0B1F33] mb-6 overflow-wrap-anywhere min-w-0">
                Friction dies here.
             </h2>
             <h3 className="text-[24px] md:text-[30px] text-[#0B1F33] mb-4 overflow-wrap-anywhere min-w-0">
                Activate your access.
             </h3>
             <p className="text-[15px] md:text-[18px] leading-[1.6] text-[rgba(11,31,51,0.62)] max-w-[600px] overflow-wrap-anywhere min-w-0">
                Your member card lives on your phone and works in seconds. Get instant access to every resident-only perk downtown.
             </p>
          </div>

          <div className="flex flex-nowrap md:grid md:grid-cols-3 gap-6 overflow-x-auto snap-x hide-scrollbar pb-4 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0">
             <div className="w-[85%] md:w-full shrink-0 snap-start bg-[#F1F3F7] p-8 md:p-10 flex flex-col justify-start">
                <div className="text-[12px] font-mono text-[#0B1F33] mb-8">01</div>
                <h4 className="text-[20px] md:text-[24px] text-[#0B1F33] mb-4">Access in seconds.</h4>
                <p className="text-[15px] text-[rgba(11,31,51,0.62)] leading-[1.6]">No app stores. No login mazes. One tap and you're in. It's that basic.</p>
             </div>

             <div className="w-[85%] md:w-full shrink-0 snap-start bg-[#F1F3F7] p-8 md:p-10 flex flex-col justify-start">
                <div className="text-[12px] font-mono text-[#0B1F33] mb-8">02</div>
                <h4 className="text-[20px] md:text-[24px] text-[#0B1F33] mb-4">Tap. Learn. Decide.</h4>
                <p className="text-[15px] text-[rgba(11,31,51,0.62)] leading-[1.6]">The map handles the friction. See what matters, and pick your spot.</p>
             </div>

             <div className="w-[85%] md:w-full shrink-0 snap-start bg-[#F1F3F7] p-8 md:p-10 flex flex-col justify-start">
                <div className="text-[12px] font-mono text-[#0B1F33] mb-8">03</div>
                <h4 className="text-[20px] md:text-[24px] text-[#0B1F33] mb-4">Scan. Done.</h4>
                <p className="text-[15px] text-[rgba(11,31,51,0.62)] leading-[1.6]">No plastic. No wallets. A digital QR card handled by the map. Friction dies.</p>
             </div>
          </div>
       </div>
    </section>
  );
}

export function HomePerksCard() {
  const navigate = useNavigate();

  return (
    <section id="perks-card" className="py-[120px] px-6 md:px-12 bg-[#F1F3F7] w-full border-b border-[rgba(11,31,51,0.08)]">
       <div className="max-w-[1200px] mx-auto w-full bg-[#FFFFFF] p-8 md:p-16 border border-[rgba(11,31,51,0.08)] flex flex-col md:flex-row gap-16 items-center">
          
          <div className="w-full md:w-1/2 flex flex-col z-10 order-2 md:order-1">
             <h2 className="font-serif text-[38px] md:text-[56px] text-[#0B1F33] mb-6 leading-[1.1] overflow-wrap-anywhere min-w-0">
                Digital Member Card
             </h2>
             <div className="text-[24px] md:text-[30px] text-[#0B1F33] mb-8">$25 / yr</div>
             
             <button onClick={() => navigate('/map?mode=resident')} className="w-full sm:w-auto px-8 py-4 bg-[#0B1F33] text-white text-[15px] font-medium hover:bg-[#132238] transition-colors mb-6 text-center">
                Complete registration
             </button>
             
             <p className="text-[13px] text-[rgba(11,31,51,0.62)] leading-[1.6]">
                If your residential building partners with Downtown Perks, your membership fee is refunded automatically and covered by your building.
             </p>
          </div>

          <div className="w-full md:w-1/2 flex justify-center order-1 md:order-2">
             <div className="w-full max-w-[320px] aspect-[1/1.4] bg-[#0B1F33] p-8 flex flex-col justify-between text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(197,160,40,0.2),transparent_60%)]" />
                <div className="relative z-10 flex justify-between items-start">
                   <div className="text-[13px] font-medium uppercase tracking-[0.1em]">Downtown Perks</div>
                   <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center">DP</div>
                </div>
                <div className="relative z-10 w-full aspect-square bg-white p-4 flex flex-col items-center justify-center">
                   <Scan className="w-24 h-24 text-[#0B1F33] opacity-20" />
                   <div className="mt-4 text-[#0B1F33] text-[11px] uppercase tracking-[0.1em] font-medium">Scan to Verify</div>
                </div>
             </div>
          </div>
       </div>
    </section>
  );
}
