import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const FEATURED_STORY = {
  id: 'nina-shore',
  firstName: 'Nina',
  label: 'The Shore resident',
  quote: 'Having a few good places already mapped out makes downtown feel easier to use.',
  favoritePerks: 'Coffee before work · Happy hour nearby · Weekend events',
  photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&h=1000&fit=crop',
  alt: 'Portrait of Nina, a downtown Austin resident',
};

export default function CommunityStories({ buildingId }) {
  const perksPath = buildingId ? `/buildings/${buildingId}/perks` : '/buildings';

  return (
    <section className="py-10 lg:py-14">
      {/* Eyebrow + headline */}
      <div className="mb-8">
        <p className="text-[11px] font-bold text-gold uppercase tracking-[0.22em] mb-2">
          Community Stories
        </p>
        <h2 className="text-2xl lg:text-4xl text-navy leading-[1.15] font-bold tracking-tight">
          What residents are actually using.
        </h2>
        <p className="text-sm lg:text-base text-textSecondary mt-2 max-w-xl leading-relaxed">
          A quick look at how downtown residents turn nearby places into weekly routines.
        </p>
      </div>

      {/* Editorial story layout */}
      <div className="bg-white rounded-2xl overflow-hidden border border-[var(--border-subtle)]">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
          {/* Photo */}
          <div className="md:col-span-2 relative min-h-[280px] md:min-h-[360px] overflow-hidden">
            <img
              src={FEATURED_STORY.photo}
              alt={FEATURED_STORY.alt}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="md:col-span-3 p-6 lg:p-10 flex flex-col justify-center gap-6">
            {/* Quote */}
            <blockquote className="text-lg lg:text-xl text-navy leading-[1.5] font-medium tracking-tight">
              &ldquo;{FEATURED_STORY.quote}&rdquo;
            </blockquote>

            {/* Resident attribution */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-navy text-base">{FEATURED_STORY.firstName}</span>
              <span className="text-sm text-textMuted">{FEATURED_STORY.label}</span>
            </div>

            {/* Divider */}
            <div className="h-px bg-[var(--border-subtle)]" />

            {/* Favorite perk */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-gold uppercase tracking-widest">
                Favorite perk
              </span>
              <span className="text-sm text-textSecondary leading-relaxed">
                {FEATURED_STORY.favoritePerks}
              </span>
            </div>

            {/* CTA */}
            <a
              href={perksPath}
              className="inline-flex items-center gap-2 text-sm font-semibold text-navy hover:text-gold transition-colors mt-2"
            >
              Explore nearby perks
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}