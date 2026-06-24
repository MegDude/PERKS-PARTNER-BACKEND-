import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Globe2, Handshake, LineChart, MapPin, ShieldCheck } from 'lucide-react';

const storySections = [
  {
    title: 'Mission',
    body: 'Downtown Perks helps operators understand and improve the relationship between buildings, residents, local partners, events, perks, and neighborhood participation.',
  },
  {
    title: 'Vision',
    body: 'The platform is designed to become the operating layer for downtown engagement: one place to manage access, campaigns, partner activity, reporting, and neighborhood intelligence.',
  },
  {
    title: 'Austin Focus',
    body: 'The first operating model is built around Downtown Austin, where residential buildings, hotels, venues, brands, civic groups, and real estate teams share the same local ecosystem.',
  },
  {
    title: 'Future Expansion',
    body: 'As the model matures, the same architecture can support additional districts, cities, portfolios, civic programs, sponsorships, and multi-location partner workspaces.',
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
    body: 'Manage offers, campaigns, events, messages, locations, reporting, and tenant workspace access.',
  },
  {
    icon: MapPin,
    title: 'Civic and Neighborhood Programs',
    body: 'Coordinate public events, district participation, surveys, programming, and community reporting.',
  },
  {
    icon: LineChart,
    title: 'Platform Operators',
    body: 'Use the command center to monitor participation, provisioning, performance, reporting, automations, and support needs.',
  },
];

const operatingPrinciples = [
  'Every public entity should map to an operational tenant, workspace, owner, and reporting container.',
  'Every module should support create, read, update, archive, delete, history, and audit logging.',
  'Every workflow should produce a measurable signal: enrollment, view, save, RSVP, redemption, response, export, or report.',
  'Every partner and property should understand what happened, what is happening, and what to do next.',
];

export default function About() {
  return (
    <div className="min-h-screen bg-[#F7F8FB] text-[#0B1F33]">
      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8">
        <section className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Internal program overview</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-normal md:text-5xl">Downtown Perks as an operating platform.</h1>
          <p className="mt-4 max-w-4xl text-base leading-7 text-[rgba(11,31,51,0.68)]">
            This page explains Downtown Perks for platform operators, property teams, partner managers, and civic collaborators. It is not a resident onboarding page. It describes the program model, the network, and the operational architecture behind the admin workspace.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/admin/home" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#0B1F33] bg-[#0B1F33] px-4 text-xs font-semibold text-white">
              Platform Welcome <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/admin/platform" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[rgba(11,31,51,0.12)] bg-white px-4 text-xs font-semibold text-[#0B1F33]">
              Command Center <ShieldCheck className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="py-12">
          <SectionHeader eyebrow="Program story" title="A shared layer for downtown operations." body="Downtown Perks is structured to connect audience, place, participation, and reporting in one system." />
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
          <SectionHeader eyebrow="Partner network" title="Who the platform connects." body="Each participant group contributes data, context, or activity that becomes useful to the broader operating model." />
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
          <SectionHeader eyebrow="Architecture principles" title="How the program should scale." body="The backend should stay organized around platform, workspace, entity, engagement, and reporting layers." />
          <div className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-5">
            <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
              <div>
                <Globe2 className="h-6 w-6 text-[#C8A96A]" />
                <h2 className="mt-4 text-xl font-semibold">Platform → Partner → Location → Action → Reporting</h2>
                <p className="mt-3 text-sm leading-6 text-[rgba(11,31,51,0.64)]">
                  The system should keep every module tied to an entity owner, a workspace, permission rules, measurable activity, and an exportable report.
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
          <SectionHeader eyebrow="Civic role" title="Neighborhood value, measured operationally." body="The civic layer turns community programs, public activity, local business participation, and resident engagement into visible, reportable outcomes." />
          <div className="grid gap-4 md:grid-cols-3">
            {['Participation', 'Awareness', 'Economic Activity'].map((item) => (
              <article key={item} className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-5">
                <h2 className="text-lg font-semibold">{item}</h2>
                <p className="mt-3 text-sm leading-6 text-[rgba(11,31,51,0.64)]">
                  Track signals across events, campaigns, offers, surveys, reports, and partner workspaces so operators can act on what is happening downtown.
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
