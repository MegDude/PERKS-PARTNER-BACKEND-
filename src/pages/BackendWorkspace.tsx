import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  Database,
  FileText,
  Megaphone,
  MessageSquare,
  Settings,
  ShoppingBag,
  Ticket,
  Users,
} from 'lucide-react';

const modules = [
  { to: '/admin/properties', label: 'Properties', detail: 'Buildings, access codes, operational inventory', icon: Building2 },
  { to: '/admin/residents', label: 'Residents', detail: 'Tenant records, units, enrollment, payment status', icon: Users },
  { to: '/admin/partner-portal', label: 'Partner Portal', detail: 'Partner-owned perks, messages, redemptions', icon: ShoppingBag },
  { to: '/admin/perks', label: 'Perks Network', detail: 'Venue offers, categories, activation status', icon: Ticket },
  { to: '/admin/events', label: 'Events', detail: 'Resident programming, RSVPs, attendance', icon: CalendarDays },
  { to: '/admin/engagement', label: 'Engagement Hub', detail: 'Campaigns, broadcasts, resident targeting', icon: Megaphone },
  { to: '/admin/surveys', label: 'Surveys', detail: 'Feedback collection and survey response flows', icon: MessageSquare },
  { to: '/admin/reports', label: 'Reports', detail: 'PDF/report exports and partner summaries', icon: FileText },
  { to: '/admin/analytics', label: 'Analytics', detail: 'Redemption trends and performance KPIs', icon: BarChart3 },
];

const platformAutomations = [
  'Survey response processing',
  'Redemption verification',
  'Partner account context',
  'Partner perk updates',
  'Partner message handling',
  'Property performance reports',
  'Partner monthly reports',
  'Resident bulk updates',
];

export default function BackendWorkspace() {
  const [health, setHealth] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/health').then((res) => res.json()),
      fetch('/api/insights/overview').then((res) => res.json()),
    ])
      .then(([healthData, overviewData]) => {
        setHealth(healthData);
        setOverview(overviewData);
      })
      .catch((error) => {
        console.error('Workspace bootstrap failed:', error);
      });
  }, []);

  const entityCount = health?.entities ? Object.keys(health.entities).length : 0;
  const populatedCount = health?.entities ? Object.values(health.entities).filter((count: any) => Number(count) > 0).length : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#11182B]">
      <section className="border-b border-[#11182B]/10 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 border border-[#11182B]/10 bg-[#F8FAFC] px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#6E7785]">
                <Database className="h-3.5 w-3.5 text-[#C5A028]" />
                Operations Workspace
              </div>
              <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-normal text-[#11182B] sm:text-4xl">
                Partner platform command center
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[#6E7785]">
                Navigate the full Downtown Perks platform from one place: properties, residents, partners, perks, events, surveys, reporting, and partner operations.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="border border-[#11182B]/10 bg-[#11182B] p-4 text-white">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/60">
                  <Activity className="h-3.5 w-3.5 text-[#C5A028]" />
                  Platform Status
                </div>
                <div className="mt-3 text-2xl font-semibold">{health?.status || '...'}</div>
              </div>
              <div className="border border-[#11182B]/10 bg-white p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#6E7785]">Data Areas</div>
                <div className="mt-3 text-2xl font-semibold">{populatedCount}/{entityCount || '...'}</div>
              </div>
              <div className="border border-[#11182B]/10 bg-white p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#6E7785]">Residents</div>
                <div className="mt-3 text-2xl font-semibold">{overview?.totalTenants ?? '...'}</div>
              </div>
              <div className="border border-[#11182B]/10 bg-white p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#6E7785]">Active Perks</div>
                <div className="mt-3 text-2xl font-semibold">{overview?.activePerks ?? '...'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Platform Modules</h2>
            <p className="text-sm font-medium text-[#6E7785]">Everything partners and operators need, one click deep.</p>
          </div>
          <Link
            to="/admin/dashboard"
            className="hidden border border-[#11182B] bg-[#11182B] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#1B2638] sm:inline-flex"
          >
            View Stats
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.to}
                to={module.to}
                className="group min-h-[138px] border border-[#11182B]/10 bg-white p-5 transition-colors hover:border-[#11182B] hover:bg-[#FAFAFA]"
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center border border-[#11182B]/10 bg-[#F8FAFC] text-[#11182B]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#C5A028] group-hover:text-[#11182B]">Open</span>
                </div>
                <h3 className="text-base font-semibold">{module.label}</h3>
                <p className="mt-2 text-sm font-medium leading-5 text-[#6E7785]">{module.detail}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-10 sm:px-8 lg:px-10">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="border border-[#11182B]/10 bg-white p-5">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#6E7785]">
              <Bell className="h-3.5 w-3.5 text-[#C5A028]" />
              Platform Automations
            </div>
            <div className="mt-4 grid gap-2">
              {platformAutomations.map((name) => (
                <div key={name} className="flex items-center justify-between border-t border-[#11182B]/10 py-2 text-sm">
                  <span className="font-semibold text-[#11182B]">{name}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#6E7785]">active</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-[#11182B]/10 bg-[#11182B] p-5 text-white">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/60">
              <Settings className="h-3.5 w-3.5 text-[#C5A028]" />
              Platform Coverage
            </div>
            <h3 className="mt-4 text-xl font-semibold">Downtown Perks operations are connected across the partner platform.</h3>
            <p className="mt-3 text-sm font-medium leading-6 text-white/70">
              Partner profiles, perk redemptions, resident engagement, surveys, reports, events, notifications, and product offerings are available from the same workspace.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
