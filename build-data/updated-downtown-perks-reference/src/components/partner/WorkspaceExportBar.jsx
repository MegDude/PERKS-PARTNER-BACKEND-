import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Download, FileSpreadsheet, Loader2, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function WorkspaceExportBar({ selectedMonth }) {
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [sheetUrl, setSheetUrl] = useState(null);

  const exportToSheets = async () => {
    setSheetsLoading(true);
    try {
      const res = await base44.functions.invoke('exportSurveyDataToSheets', {});
      const data = res.data || res;
      if (data?.spreadsheet_url) {
        setSheetUrl(data.spreadsheet_url);
        toast.success(`Exported ${data.survey_rows_exported || 0} surveys & ${data.redemption_rows_exported || 0} redemptions`);
      } else {
        toast.success('Export complete');
      }
    } catch (error) {
      toast.error('Export failed: ' + (error.message || 'Unknown error'));
    } finally {
      setSheetsLoading(false);
    }
  };

  const generateAllReports = async () => {
    setReportsLoading(true);
    try {
      const res = await base44.functions.invoke('generatePartnerMonthlyReport', { year_month: selectedMonth });
      const data = res.data || res;
      const count = data?.reports_generated || 0;
      toast.success(`${count} partner report${count !== 1 ? 's' : ''} generated & emailed`);
    } catch (error) {
      toast.error('Report generation failed: ' + (error.message || 'Unknown error'));
    } finally {
      setReportsLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
      <button
        onClick={exportToSheets}
        disabled={sheetsLoading}
        className={cn(
          'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors',
          'bg-white border border-[var(--border-subtle)] text-navy hover:bg-bgAlt'
        )}
      >
        {sheetsLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : sheetUrl ? (
          <FileSpreadsheet className="w-4 h-4 text-green-600" />
        ) : (
          <FileSpreadsheet className="w-4 h-4" />
        )}
        {sheetUrl ? (
          <a href={sheetUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
            Open Sheet <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          'Export to Sheets'
        )}
      </button>

      <button
        onClick={generateAllReports}
        disabled={reportsLoading}
        className="flex items-center justify-center gap-2 bg-navy text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-navySoft transition-colors"
      >
        {reportsLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        Generate All Reports
      </button>
    </div>
  );
}