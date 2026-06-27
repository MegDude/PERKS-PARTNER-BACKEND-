import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Globe2, Handshake, LineChart, MapPin, ShieldCheck } from 'lucide-react';

const storySections = [
  {
    title: 'Why it exists',
    body: 'Downtown Perks helps buildings, residents, local partners, and events feel a little closer to each other.',
  },
  {
    title: 'Vision',
    body: 'One calm place to keep access, local notes, partner activity, and reports from drifting apart.',
  },
  {
    title: 'Austin Focus',
    body: 'The first version is built for Downtown Austin, where buildings, hotels, venues, brands, civic groups, and real estate teams already share the same streets.',
  },
  {
    title: 'Future Expansion',
    body: 'As the model grows, the same shape can support more districts, cities, portfolios, civic programs, sponsors, and partner spaces.',
  },
];

const networkRoles = [
  {
    icon: Building2,
    title: 'Properties',
    body: 'Connect resident access, building context, amenities, surveys, and retention signals to the wider local network.',
  },
  {
    icon: Handshake,
    title: 'Partners',
    body: 'Keep offers, events, messages, locations, reports, and partner access in good order.',
  },
  {
    icon: MapPin,
    title: 'Civic and Neighborhood Programs',
    body: 'Coordinate public events, local participation, surveys, programming, and useful reporting.',
  },
  {
    icon: LineChart,
    title: 'Downtown Perks Team',
    body: 'See participation, setup, reports, follow-ups, and support needs before they get messy.',
  },
];

const operatingPrinciples = [
  'Every public place should have a clear owner and a clear report.',
  'Every area should be easy to open, edit, save, archive, and review.',
  'Every action should leave a useful signal: join, view, save, RSVP, use, respond, export, or report.',
  'Every partner and property should understand what happened, what is happening, and what to do next.',
];

export default function About() {
  return (
    <div className="min-h-screen bg-[#F7F8FB] text-[#0B1F33]">
      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8">
        <section className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">About Downtown Perks</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-normal md:text-5xl">A better downtown starts close to home.</h1>
          <p className="mt-4 max-w-4xl text-base leading-7 text-[rgba(11,31,51,0.68)]">
            Downtown Perks connects buildings, residents, local partners, events, and reports so the neighborhood feels easier to use and easier to care for.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/admin/home" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#0B1F33] bg-[#0B1F33] px-4 text-xs font-semibold text-white">
              Start here <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/admin/platform" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[rgba(11,31,51,0.12)] bg-white px-4 text-xs font-semibold text-[#0B1F33]">
              See today <ShieldCheck className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="py-12">
          <SectionHeader eyebrow="Program story" title="Life downtown moves fast. We help people keep up." body="The work is simple: connect people to nearby places, then show what helped." />
          <div className="grid gap-4 md:grid-cols-2">
            {storySections.map((section) => (
              <article key={section.title} className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-5">
                <h2 className="text-lg font-semibold">{section.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[rgba(11,31,51,0.64)]">{section.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="py-12">
          <SectionHeader eyebrow="Partner network" title="Who comes along." body="Each group adds something useful: a place, a perk, an event, a resident moment, or a clearer next step." />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {networkRoles.map((role) => {
              const Icon = role.icon;
              return (
                <article key={role.title} className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-5">
                  <Icon className="h-5 w-5 text-[#C8A96A]" />
                  <h2 className="mt-4 text-lg font-semibold">{role.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-[rgba(11,31,51,0.64)]">{role.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="py-12">
          <SectionHeader eyebrow="How it grows" title="Keep the shape simple." body="Every place, partner, event, and report should be easy to find, understand, and act on." />
          <div className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-5">
            <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
              <div>
                <Globe2 className="h-6 w-6 text-[#C8A96A]" />
                <h2 className="mt-4 text-xl font-semibold">Place → Partner → Action → Report</h2>
                <p className="mt-3 text-sm leading-6 text-[rgba(11,31,51,0.64)]">
                  The app should make it clear who owns the work, what happened, and what should happen next.
                </p>
              </div>
              <div className="grid gap-3">
                {operatingPrinciples.map((principle) => (
                  <div key={principle} className="border-y border-[rgba(11,31,51,0.08)] py-3 text-sm leading-6 text-[rgba(11,31,51,0.68)]">
                    {principle}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <SectionHeader eyebrow="Civic role" title="The neighborhood gets better when people can see what is working." body="Public programs, local business activity, resident feedback, and events become easier to understand and easier to improve." />
          <div className="grid gap-4 md:grid-cols-3">
            {['Participation', 'Awareness', 'Economic Activity'].map((item) => (
              <article key={item} className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-5">
                <h2 className="text-lg font-semibold">{item}</h2>
                <p className="mt-3 text-sm leading-6 text-[rgba(11,31,51,0.64)]">
                  Track what people joined, saved, used, answered, and cared about so the next downtown move is smarter.
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, body }: any) {
  return (
    <div className="mb-6 max-w-4xl">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-normal text-[#0B1F33] md:text-3xl">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.62)] md:text-base">{body}</p>
    </div>
  );
}
