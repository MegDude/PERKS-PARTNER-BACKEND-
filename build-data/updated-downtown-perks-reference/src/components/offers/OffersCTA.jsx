import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { OFFER_IMAGES } from '@/data/offerImages';

export default function OffersCTA() {
  return (
    <section className="px-6 lg:px-12 py-16 lg:py-24 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl bg-navy shadow-xl"
      >
        {/* Image side */}
        <div className="relative aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9]">
          <img
            src={OFFER_IMAGES.cta}
            alt="Austin venue owner preparing for service"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/50 to-navy/20" />
        </div>

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-12">
          <p className="text-gold text-xs font-semibold uppercase tracking-[0.25em] mb-3">
            Next Step
          </p>
          <h2 className="text-white text-2xl lg:text-4xl font-bold tracking-tight max-w-lg leading-tight">
            Launch an offer.
          </h2>
          <p className="text-white/80 text-sm lg:text-base mt-3 max-w-md">
            Ready to give people a reason to visit. Your moment starts now.
          </p>
          <div className="mt-6">
            <a
              href="/partner-portal"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gold text-navy font-semibold text-sm shadow-gold hover:shadow-gold-lg hover:bg-gold-soft transition-all duration-300 active:scale-[0.97]"
            >
              Launch an Offer
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}