import React from 'react';
import { motion } from 'framer-motion';
import { OFFER_IMAGES } from '@/data/offerImages';

export default function OffersHero() {
  return (
    <section className="relative w-full overflow-hidden bg-navy">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={OFFER_IMAGES.hero}
          alt="People enjoying Downtown Austin during golden hour"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/40 to-navy/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative px-6 lg:px-12 py-24 lg:py-36 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-gold text-xs font-semibold uppercase tracking-[0.25em] mb-5">
            Downtown Perks · Offers
          </p>
          <h1 className="text-white text-4xl lg:text-6xl font-bold tracking-tight leading-[1.05] max-w-3xl">
            Give people a reason to act now.
          </h1>
          <p className="text-white/80 text-base lg:text-lg mt-6 max-w-xl leading-relaxed">
            Offers aren't discounts. They're motivation — a reason to stop, visit,
            try, return, upgrade, participate, or discover.
          </p>
        </motion.div>
      </div>
    </section>
  );
}