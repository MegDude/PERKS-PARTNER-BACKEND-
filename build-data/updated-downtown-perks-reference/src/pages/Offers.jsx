import React from 'react';
import OffersHero from '@/components/offers/OffersHero';
import OffersGrid from '@/components/offers/OffersGrid';
import OffersCTA from '@/components/offers/OffersCTA';

export default function Offers() {
  return (
    <div className="min-h-screen bg-bgMain pb-20">
      <OffersHero />
      <OffersGrid />
      <OffersCTA />
    </div>
  );
}