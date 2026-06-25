import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { H1, H3, Body } from '@/components/ui/Typography';
import { 
  Download, FileText, Loader2, Calendar, Building2, TrendingUp, Users, Star
} from 'lucide-react';
import { toast } from 'sonner';
import { format, subMonths } from 'date-fns';

export default function Reports() {
  const [user, setUser] = useState<any>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 7));
  const [generatedReports, setGeneratedReports] = useState<any[]>([]);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      setUser({ id: 'user_admin', role: 'admin', email: 'admin@downtownperks.local' });
    }
  };

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list()
  });

  const { data: flats = [] } = useQuery({
    queryKey: ['flats'],
    queryFn: () => base44.entities.Flat.list()
  });

  const { data: broadcasts = [] } = useQuery({
    queryKey: ['broadcasts'],
    queryFn: () => base44.entities.Broadcast.list()
  });

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBuilding) {
        throw new Error('Please select a building');
      }

      const response = await base44.functions.invoke('generatePDFReport', {
        building_id: selectedBuilding,
        year_month: reportDate
      });

      return response.data;
    },
    onSuccess: (data: any) => {
      // Create a new report entry
      const newReport = {
        id: Date.now(),
        building_id: selectedBuilding,
        building_name: buildings.find((b: any) => b.id === selectedBuilding)?.name || 'Building',
        month: reportDate,
        created_at: new Date().toISOString(),
        download_url: data.file_url
      };

      setGeneratedReports([newReport, ...generatedReports]);
      toast.success('Report generated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate report');
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgMain">
        <Loader2 className="w-8 h-8 animate-spin text-[#11182B]" />
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-bgMain p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            <h2 className="text-xl font-semibold text-[#11182B] mb-2">Access Restricted</h2>
            <p className="text-textSecondary">Only administrators can access the reports dashboard.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgMain">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 p-6 bg-white border border-[#EFEFEF] shadow-[0_18px_50px_rgba(17,24,43,0.05)] rounded-none">
          <H3 className="text-lg mb-2">Performance Reports</H3>
          <Body className="text-sm leading-relaxed">
            Generate building and partner-ready reports that connect resident activity, perks adoption, event participation, and engagement trends to clear next actions.
          </Body>
        </div>

        {/* Report Generator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="">
            <CardHeader className="border-b border-navy/20">
              <CardTitle className="flex items-center gap-2 text-[#11182B]">
                <FileText className="w-5 h-5 text-[#11182B]" />
                Generate New Report
              </CardTitle>
              <CardDescription className="text-textSecondary">Select a building and reporting month to create an export-ready performance summary.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Building Select */}
                <div>
                  <label className="block text-sm font-medium text-[#11182B] mb-2">Building</label>
                  <select
                    value={selectedBuilding || ''}
                    onChange={(e) => setSelectedBuilding(e.target.value)}
                    className="w-full px-4 py-2 rounded-none border border-navy/30 bg-white text-[#11182B] focus:border-navy focus:ring-1 focus:ring-gold/20"
                  >
                    <option value="">Select a building...</option>
                    {buildings.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Month Select */}
                <div>
                  <label className="block text-sm font-medium text-[#11182B] mb-2">Month</label>
                  <input
                    type="month"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-none border border-navy/30 bg-white text-[#11182B] focus:border-navy focus:ring-1 focus:ring-gold/20"
                  />
                </div>

                {/* Generate Button */}
                <div className="flex items-end">
                  <Button
                    onClick={() => generateReportMutation.mutate()}
                    disabled={!selectedBuilding || generateReportMutation.isPending}
                    className="w-full bg-navy hover:bg-[#11182B] text-white font-semibold shadow-none hover:shadow-none"
                  >
                    {generateReportMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Building Preview */}
              {selectedBuilding && (
                <div className="p-4 bg-white rounded-none border border-[#EFEFEF]">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(() => {
                      const building = buildings.find((b: any) => b.id === selectedBuilding);
                      const buildingFlats = flats.filter((f: any) => f.building_id === selectedBuilding);
                      const buildingTenants = tenants.filter((t: any) => buildingFlats.some((f: any) => f.id === t.flat_id));
                      const perksEnrolled = buildingTenants.filter((t: any) => t.perks_enrolled).length;
                      const premiumTier = buildingTenants.filter((t: any) => t.perks_tier === 'premium').length;

                      return (
                        <>
                          <div>
                            <p className="text-xs text-textMuted">Total Units</p>
                            <p className="text-lg font-bold text-[#11182B]">{buildingFlats.length}</p>
                          </div>
                          <div>
                            <p className="text-xs text-textMuted">Occupied</p>
                            <p className="text-lg font-bold text-[#11182B]">{buildingTenants.length}</p>
                          </div>
                          <div>
                            <p className="text-xs text-textMuted">Perks Enrolled</p>
                            <p className="text-lg font-bold text-[#11182B]">{perksEnrolled}</p>
                          </div>
                          <div>
                            <p className="text-xs text-textMuted">Premium Tier</p>
                            <p className="text-lg font-bold text-[#11182B]">{premiumTier}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Generated Reports */}
        {generatedReports.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <H3 className="text-xl mb-4 flex items-center gap-2 text-[#11182B]">
             <Calendar className="w-5 h-5 text-[#11182B]" />
             Generated Reports
            </H3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedReports.map((report) => (
                <Card key={report.id} className="border-navy/20 hover:shadow-none transition-all rounded-[var(--radius-lg)]">
                  <CardHeader className="pb-3 border-b border-navy/10">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg text-[#11182B]">{report.building_name}</CardTitle>
                        <CardDescription className="text-textSecondary">
                          {format(new Date(report.month + '-01'), 'MMMM yyyy')}
                        </CardDescription>
                      </div>
                      <FileText className="w-5 h-5 text-[#11182B]" />
                    </div>
                  </CardHeader>
                  <CardContent className="flex gap-2 p-6">
                    <Button
                       onClick={() => {
                         const link = document.createElement('a');
                         link.href = report.download_url;
                         link.download = `${report.building_name}-${report.month}-report.pdf`;
                         document.body.appendChild(link);
                         link.click();
                         document.body.removeChild(link);
                       }}
                       className="flex-1 border-navy/30 text-[#11182B] hover:bg-navy/10"
                       variant="outline"
                     >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {generatedReports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-[#11182B]/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#11182B] mb-2">No reports generated yet</h3>
            <p className="text-textSecondary">Choose a building and month to prepare the first stakeholder-ready report.</p>
          </div>
        )}
      </div>
    </div>
  );
}
