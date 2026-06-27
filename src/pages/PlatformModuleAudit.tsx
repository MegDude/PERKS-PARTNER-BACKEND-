import React from "react";
import { CheckCircle2, Database, FileCode2, PlugZap, Settings2 } from "lucide-react";
import { platformModuleAuditItems, summarizePlatformModuleAudit } from "@/data/platformModuleAudit";
import { createAgentMemoryRecord } from "@/lib/intelligence/agentMemory";
import { parseAskMapIntent } from "@/lib/intelligence/askMapService";
import { generatePulseSignal } from "@/lib/intelligence/pulseEngine";
import { normalizeEventOccurrence } from "@/lib/events/eventIngestion";
import { createAttributionEvent } from "@/lib/campaigns/attribution";
import { isValidCoordinate } from "@/lib/mapValidation";

const statusStyles: Record<string, string> = {
  installed: "border-[#C8A96A] text-[#0B1F33]",
  "existing-backend": "border-[rgba(11,31,51,0.16)] text-[#0B1F33]",
  "pending-configuration": "border-amber-300 text-amber-800",
};

const statusLabels: Record<string, string> = {
  installed: "Ready",
  "existing-backend": "Already here",
  "pending-configuration": "Needs setup",
};

export default function PlatformModuleAudit() {
  const summary = summarizePlatformModuleAudit();
  const smokeTests = [
    { label: "Agent memory", value: createAgentMemoryRecord({ query: "coffee near The Shore", mode: "resident" }).source },
    { label: "Ask Map intent", value: parseAskMapIntent("show campaign demand signals", "partner") },
    { label: "Pulse signal", value: generatePulseSignal({ views: 120, saves: 18, rsvps: 9, district: "Rainey" }).partnerHeadline },
    { label: "Event ingestion", value: normalizeEventOccurrence("google_calendar", { title: "Resident Mixer", start: "2026-07-11" }).status },
    { label: "Attribution", value: createAttributionEvent("save", { campaign_id: "shore-welcome" }).table },
    { label: "Map validation", value: isValidCoordinate(30.268, -97.742) ? "Austin coordinates valid" : "Invalid" },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FB] px-4 py-6 text-[#0B1F33] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="border border-[rgba(11,31,51,0.08)] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase text-[#C8A96A]">
                <PlugZap className="h-4 w-4" />
                What is wired
              </div>
              <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">Downtown Perks, checked and ready</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[rgba(11,31,51,0.66)]">
                A simple check of the pieces that keep the app useful: map questions, resident signals, events, results, and follow-up.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
              <div className="border border-[rgba(11,31,51,0.08)] bg-[#F7F8FB] p-3">
                <div className="text-2xl font-semibold">{summary.total}</div>
                <div className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Checked</div>
              </div>
              <div className="border border-[rgba(11,31,51,0.08)] bg-[#F7F8FB] p-3">
                <div className="text-2xl font-semibold">{summary.installed}</div>
                <div className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Installed</div>
              </div>
              <div className="border border-[rgba(11,31,51,0.08)] bg-[#F7F8FB] p-3">
                <div className="text-2xl font-semibold">{summary["existing-backend"]}</div>
                <div className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Existing</div>
              </div>
              <div className="border border-[rgba(11,31,51,0.08)] bg-[#F7F8FB] p-3">
                <div className="text-2xl font-semibold">{summary["pending-configuration"]}</div>
                <div className="text-[10px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Pending</div>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-3 lg:grid-cols-3">
          {smokeTests.map((test) => (
            <div key={test.label} className="border border-[rgba(11,31,51,0.08)] bg-white p-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase text-[#C8A96A]">
                <CheckCircle2 className="h-4 w-4" />
                Quick check
              </div>
              <div className="mt-2 text-sm font-semibold">{test.label}</div>
              <div className="mt-1 text-xs leading-5 text-[rgba(11,31,51,0.64)]">{String(test.value)}</div>
            </div>
          ))}
        </section>

        <section className="grid gap-3">
          {platformModuleAuditItems.map((item) => (
            <article key={item.id} className="border border-[rgba(11,31,51,0.08)] bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {item.status === "existing-backend" ? <Database className="h-4 w-4 text-[#C8A96A]" /> : item.status === "pending-configuration" ? <Settings2 className="h-4 w-4 text-[#C8A96A]" /> : <FileCode2 className="h-4 w-4 text-[#C8A96A]" />}
                    <h2 className="text-base font-semibold">{item.label}</h2>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.66)]">{item.notes}</p>
                </div>
                <span className={`shrink-0 border px-3 py-2 text-[10px] font-bold uppercase ${statusStyles[item.status]}`}>{statusLabels[item.status] || item.status}</span>
              </div>
              <div className="mt-4 grid gap-2 text-xs leading-5 text-[rgba(11,31,51,0.62)] lg:grid-cols-2">
                <div><span className="font-bold text-[#0B1F33]">Comes from:</span> {item.sourcePath}</div>
                <div><span className="font-bold text-[#0B1F33]">Lives here:</span> {item.installedPath}</div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
