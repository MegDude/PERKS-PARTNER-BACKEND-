import React from 'react';
import { OFFERS } from '@/data/offerImages';
import OfferCard from './OfferCard';

export default function OffersGrid() {
  return (
    <section className="px-6 lg:px-12 py-16 lg:py-24 max-w-7xl mx-auto">
      <div className="mb-10 lg:mb-14">
        <h2 className="text-navy text-2xl lg:text-4xl font-bold tracking-tight">
          Moments people want to experience.
        </h2>
        <p className="text-textSecondary text-sm lg:text-base mt-3 max-w-2xl">
          Each offer creates a reason — to start the day, to stop after work,
          to try something new, to come back. Not coupons. Not promotions. Motivation.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
        {OFFERS.map((offer, i) => (
          <OfferCard key={offer.id} offer={offer} index={i} />
        ))}
      </div>
    </section>
  );
}