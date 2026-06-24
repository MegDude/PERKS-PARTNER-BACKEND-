import React from 'react';
import { motion } from 'framer-motion';

export default function OfferCard({ offer, index = 0 }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 2) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl bg-bgCard border border-[var(--border-subtle)] shadow-sm hover:shadow-lg transition-all duration-500"
    >
      {/* 4:5 portrait image */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={offer.image}
          alt={offer.label}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-transparent to-transparent" />
        {/* Label */}
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-navy text-xs font-semibold tracking-wide shadow-sm">
            {offer.label}
          </span>
        </div>
      </div>

      {/* Story */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <p className="text-white text-lg lg:text-xl font-medium leading-snug tracking-tight">
          {offer.story}
        </p>
      </div>
    </motion.article>
  );
}