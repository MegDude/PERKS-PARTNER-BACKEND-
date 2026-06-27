import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, CircleDashed, Database, FileCode2, PlugZap, Settings2 } from "lucide-react";
import { platformModuleAuditItems, summarizePlatformModuleAudit } from "@/data/platformModuleAudit";
import { createAgentMemoryRecord } from "@/lib/intelligence/agentMemory";
import { parseAskMapIntent } from "@/lib/intelligence/askMapService";
import { generatePulseSignal } from "@/lib/intelligence/pulseEngine";
import { normalizeEventOccurrence } from "@/lib/events/eventIngestion";
import { createAttributionEvent } from "@/lib/campaigns/attribution";
import { isValidCoordinate } from "@/lib/mapValidation";

const statusLabels: Record<string, string> = {
  installed: "Ready",
  "existing-backend": "In place",
  "pending-configuration": "Needs setup",
};

const actionRoutes: Record<string, string> = {
  "pending-configuration": "/admin/settings",
  installed: "/admin/platform",
  "existing-backend": "/admin/platform",
};

export default function PlatformModuleAudit() {
  const summary = summarizePlatformModuleAudit();
  const liveChecks = [
    { label: "Agent memory", value: createAgentMemoryRecord({ query: "coffee near The Shore", mode: "resident" }).source, detail: "Keeps assistant context tied to the task." },
    { label: "Ask Map", value: parseAskMapIntent("show campaign demand", "partner"), detail: "Turns a plain question into the right map action." },
    { label: "Pulse read", value: generatePulseSignal({ views: 120, saves: 18, rsvps: 9, district: "Rainey" }).partnerHeadline, detail: "Reads recent activity and suggests the next move." },
    { label: "Events", value: normalizeEventOccurrence("google_calendar", { title: "Resident Mixer", start: "2026-07-11" }).status, detail: "Cleans outside events before they reach the app." },
    { label: "Attribution", value: createAttributionEvent("save", { campaign_id: "shore-welcome" }).table, detail: "Connects saves, clicks, scans, and use to a campaign." },
    { label: "Map check", value: isValidCoordinate(30.268, -97.742) ? "Austin coordinates valid" : "Invalid", detail: "Stops broken coordinates before a pin moves." },
  ];
  const quickLook = [
    { label: "Checked", value: summary.total, detail: "Modules reviewed against this app." },
    { label: "Ready", value: summary.installed, detail: "Built and available now." },
    { label: "In place", value: summary["existing-backend"], detail: "Covered by the current backend or route set." },
    { label: "Needs setup", value: summary["pending-configuration"], detail: "Code is present. Credentials or provider setup remains." },
    ...liveChecks,
  ];

  return (
    <div className="min-h-screen bg-white text-[#0B1F33]">
      <div className="mx-auto max-w-[1180px] space-y-6 px-5 py-7 sm:px-8">
        <header className="bg-white">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#C8A96A]">
            <PlugZap className="h-4 w-4" />
            Platform tools
          </div>
          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-[26px] font-semibold leading-tight sm:text-[32px]">What is built, what is ready, what needs setup</h1>
              <p className="mt-2 max-w-3xl text-[13px] leading-5 text-[rgba(11,31,51,0.64)]">
                A clean read on the tools behind Downtown Perks: the map, events, campaigns, surveys, reporting, messages, and the assistant layer.
              </p>
            </div>
            <Link
              to="/admin/settings"
              className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 bg-[#0B1F33] px-3 text-[11px] font-semibold text-white"
            >
              Implement remaining setup <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        <section className="bg-white" aria-label="Quick look">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#C8A96A]">
            <CheckCircle2 className="h-4 w-4" />
            Quick look
          </div>
          <div className="dp-summary-matrix grid gap-0 sm:grid-cols-2 lg:grid-cols-5">
            {quickLook.map((item) => (
              <div key={item.label} className="min-w-0 py-2 pr-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[rgba(11,31,51,0.48)]">{item.label}</div>
                <div className="mt-0.5 truncate text-[13px] font-semibold leading-5 text-[#0B1F33]">{String(item.value)}</div>
                <p className="mt-0.5 text-[11px] leading-4 text-[rgba(11,31,51,0.58)]">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-0" aria-label="Module list">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#C8A96A]">Module list</div>
          <div className="divide-y divide-[rgba(11,31,51,0.08)]">
            {platformModuleAuditItems.map((item) => {
              const needsSetup = item.status === "pending-configuration";
              const Icon = item.status === "existing-backend" ? Database : needsSetup ? Settings2 : FileCode2;
              return (
                <article key={item.id} className="grid gap-3 py-4 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-start">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0 text-[#C8A96A]" />
                      <h2 className="truncate text-[14px] font-semibold leading-5">{item.label}</h2>
                      <span className="hidden text-[11px] text-[rgba(11,31,51,0.42)] sm:inline">/ {statusLabels[item.status]}</span>
                    </div>
                    <p className="mt-1 max-w-4xl text-[12px] leading-5 text-[rgba(11,31,51,0.66)]">{item.notes}</p>
                    <div className="mt-2 grid gap-1 text-[11px] leading-4 text-[rgba(11,31,51,0.52)] lg:grid-cols-2">
                      <div className="truncate"><span className="font-semibold text-[#0B1F33]">Comes from:</span> {item.sourcePath}</div>
                      <div className="truncate"><span className="font-semibold text-[#0B1F33]">Lives here:</span> {item.installedPath}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-start gap-2 lg:justify-end">
                    <span className={`inline-flex h-8 items-center gap-1.5 px-2 text-[10px] font-semibold uppercase ${needsSetup ? "text-amber-700" : "text-[#0B1F33]"}`}>
                      {needsSetup ? <CircleDashed className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5 text-[#C8A96A]" />}
                      {statusLabels[item.status]}
                    </span>
                    <Link
                      to={actionRoutes[item.status]}
                      className={`inline-flex h-8 items-center justify-center gap-1.5 px-3 text-[11px] font-semibold ${needsSetup ? "bg-[#0B1F33] text-white" : "bg-white text-[#0B1F33]"}`}
                    >
                      {needsSetup ? "Implement" : "Open"} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
