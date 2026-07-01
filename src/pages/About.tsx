import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Globe2, Handshake, LineChart, MapPin, QrCode, ShieldCheck, Users } from 'lucide-react';

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
    body: 'Give residents a useful neighborhood amenity: nearby perks, events, building notes, and simple reports that show what people used.',
  },
  {
    icon: Handshake,
    title: 'Local partners',
    body: 'Put restaurants, coffee shops, wellness studios, hotels, venues, brands, and services where nearby residents are already deciding what to do.',
  },
  {
    icon: MapPin,
    title: 'Civic and Neighborhood Programs',
    body: 'Make neighborhood updates, public events, surveys, and community programs easier to find and easier to measure.',
  },
  {
    icon: LineChart,
    title: 'Real estate teams',
    body: 'Add a “want to live here?” path to the map so interested walkers, residents, and newcomers can reach the right property contact.',
  },
];

const operatingPrinciples = [
  'Residents scan a QR code or open a link. No app download is required.',
  'The map shows nearby places, perks, events, buildings, and useful neighborhood context.',
  'Residents can save a place, RSVP to an event, redeem an offer, or open a property inquiry.',
  'Partners and properties can see simple results: views, saves, scans, RSVPs, redemptions, and reports.',
];

const simpleFlow = [
  {
    icon: QrCode,
    title: 'Scan',
    body: 'A resident scans a building sign, venue code, email link, or resident card prompt.',
  },
  {
    icon: MapPin,
    title: 'Discover',
    body: 'They land on a mobile map with nearby places, perks, events, and property context.',
  },
  {
    icon: Users,
    title: 'Take part',
    body: 'They save a place, join an event, use a perk, answer a survey, or ask about a building.',
  },
  {
    icon: LineChart,
    title: 'See what worked',
    body: 'The workspace turns those actions into reports partners can understand and use.',
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-[#F7F8FB] text-[#0B1F33]">
      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8">
        <section className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">About Downtown Perks</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-normal md:text-5xl">A better downtown starts close to home.</h1>
          <p className="mt-4 max-w-4xl text-base leading-7 text-[rgba(11,31,51,0.68)]">
            Downtown Perks is a web-based guide for downtown Austin. It connects residents, local businesses, buildings, civic programs, events, and reports through a simple map and QR-powered resident card.
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
          <SectionHeader eyebrow="How it works" title="Scan, see what is nearby, and act." body="The resident experience stays light. The operating system behind it keeps the records, reports, and partner follow-up in order." />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {simpleFlow.map((step) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-5">
                  <Icon className="h-5 w-5 text-[#C8A96A]" />
                  <h2 className="mt-4 text-lg font-semibold">{step.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-[rgba(11,31,51,0.64)]">{step.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="py-12">
          <SectionHeader eyebrow="Partner network" title="Who uses it." body="Each group gets a different value from the same system: residents get a simpler downtown, partners get useful attention, and operators get clear reporting." />
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
