import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { HomeHeader, HomeHero, HomeContext, HomeSearchLess } from '../components/home/HomeTop';
import { HomeLiveMap, HomeHowItWorks, HomePerksCard } from '../components/home/HomeMiddle';
import { HomePartners, HomePricing, HomeRollout, HomeIncluded } from '../components/home/HomePartners';
import { HomeFaq, HomeJoin, HomeFooter } from '../components/home/HomeBottom';

export default function Home() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-[#F7F8FB] text-[#0B1F33] selection:bg-[#C5A028] selection:text-[#0B1F33] font-sans antialiased overflow-x-hidden">
      <HomeHeader />
      <main>
        <HomeHero />
        <HomeContext />
        <HomeSearchLess />
        <HomeLiveMap />
        <HomeHowItWorks />
        <HomePerksCard />
        <HomePartners />
        <HomePricing />
        <HomeRollout />
        <HomeIncluded />
        <HomeFaq />
        <HomeJoin />
      </main>
      <HomeFooter />
    </div>
  );
}
