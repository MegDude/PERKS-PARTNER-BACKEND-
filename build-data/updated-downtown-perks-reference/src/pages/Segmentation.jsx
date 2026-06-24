import { useState, useEffect } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Zap, TrendingUp, BarChart3, Mail, Loader2, Home, Phone, Star, ArrowLeft
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { segmentResidents, getEngagementStats, calculateEngagementLevel } from '@/utils/engagementSegmentation';
import ResidentProfileModal from '@/components/ResidentProfileModal';

export default function Segmentation() {
  const navigate = useNavigate();
  const routeParams = useParams();
  const buildingId = routeParams.buildingId;
  const outletContext = useOutletContext();
  // Use canonical buildingId from outlet context (BuildingLayout) as primary,
  // fall back to route param. This prevents "Building not found" when the
  // building is valid but the registry hasn't loaded the specific record yet.
  const resolvedBuildingId = outletContext?.buildingId || buildingId;
  const resolvedBuildingName = outletContext?.building?.name;
  const [user, setUser] = useState(null);
  const [selectedResidents, setSelectedResidents] = useState(new Set());
  const [bulkMessageOpen, setBulkMessageOpen] = useState(false);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      base44.auth.redirectToLogin();
    }
  };

  const { data: residents = [], isLoading } = useQuery({
    queryKey: ['residents', resolvedBuildingId],
    queryFn: async () => {
      const allResidents = await base44.entities.Tenant.list();
      if (!resolvedBuildingId) return allResidents;
      const buildingFlats = await base44.entities.Flat.list();
      return allResidents.filter(r => buildingFlats.some(f => f.id === r.flat_id && f.building_id === resolvedBuildingId));
    }
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: flats = [] } = useQuery({
    queryKey: ['flats', resolvedBuildingId],
    queryFn: async () => {
      const allFlats = await base44.entities.Flat.list();
      if (!resolvedBuildingId) return allFlats;
      return allFlats.filter(f => f.building_id === resolvedBuildingId);
    }
  });

  const { data: redemptions = [] } = useQuery({
    queryKey: ['redemptions', resolvedBuildingId],
    queryFn: async () => {
      const allRedemptions = await base44.entities.PerkRedemption.list();
      if (!resolvedBuildingId) return allRedemptions;
      const buildingFlats = await base44.entities.Flat.list();
      const buildingTenants = residents.filter(r => buildingFlats.some(f => f.id === r.flat_id && f.building_id === resolvedBuildingId));
      const buildingEmails = buildingTenants.map(t => t.email);
      return allRedemptions.filter(r => buildingEmails.includes(r.user_email));
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgMain">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-bgMain p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            <h2 className="text-xl font-semibold text-navy mb-2">Access Restricted</h2>
            <p className="text-textSecondary">Only administrators can access segmentation tools.</p>
          </Card>
        </div>
      </div>
    );
  }

  // Enrich residents with building info
  const enrichedResidents = residents.map(resident => {
    const flat = flats.find(f => f.id === resident.flat_id);
    const building = flat ? buildings.find(b => b.id === flat.building_id) : null;
    return { ...resident, flat, building };
  });

  // Use resolved building ID (from outlet context or route param) for all lookups
  const currentBuilding = resolvedBuildingId
    ? buildings.find(b => b.id === resolvedBuildingId) || outletContext?.building || null
    : null;
  const filteredResidents = resolvedBuildingId && enrichedResidents.length > 0
    ? enrichedResidents.filter(r => r.building?.id === resolvedBuildingId)
    : enrichedResidents;

  const segments = segmentResidents(filteredResidents);
  const stats = getEngagementStats(filteredResidents);

  const uniqueBuildings = [...new Map(enrichedResidents.map(r => [r.building?.id, r.building])).values()].filter(Boolean);

  const toggleResident = (residentId) => {
    const newSelected = new Set(selectedResidents);
    if (newSelected.has(residentId)) {
      newSelected.delete(residentId);
    } else {
      newSelected.add(residentId);
    }
    setSelectedResidents(newSelected);
  };

  const toggleSegmentAll = (residentList) => {
    const newSelected = new Set(selectedResidents);
    const allInSegment = residentList.every(r => newSelected.has(r.id));
    
    if (allInSegment) {
      residentList.forEach(r => newSelected.delete(r.id));
    } else {
      residentList.forEach(r => newSelected.add(r.id));
    }
    setSelectedResidents(newSelected);
  };

  const handleSendBulkEmail = async () => {
    if (!messageSubject.trim() || !messageBody.trim()) {
      alert('Please fill in both subject and message');
      return;
    }

    setIsSending(true);
    const selectedList = filteredResidents.filter(r => selectedResidents.has(r.id));
    let successCount = 0;

    for (const resident of selectedList) {
      if (resident.email) {
        await base44.integrations.Core.SendEmail({
          to: resident.email,
          subject: messageSubject,
          body: messageBody
        }).catch(() => {});
        successCount++;
      }
    }

    setIsSending(false);
    alert(`Email sent to ${successCount} resident(s)`);
    setSelectedResidents(new Set());
    setMessageSubject('');
    setMessageBody('');
    setBulkMessageOpen(false);
  };

  const segmentConfig = {
    'Power User': {
      icon: Zap,
      color: 'text-gold',
      bgColor: 'bg-gold/10',
      borderColor: 'border-gold/30',
      description: 'VIP or Premium tier members actively engaging with perks'
    },
    'Occasional': {
      icon: TrendingUp,
      color: 'text-navy',
      bgColor: 'bg-navy/5',
      borderColor: 'border-navy/20',
      description: 'Standard tier members enrolled in perks'
    },
    'Inactive': {
      icon: Users,
      color: 'text-textMuted',
      bgColor: 'bg-bgAlt',
      borderColor: 'border-[var(--border-subtle)]',
      description: 'Not enrolled in Downtown Perks program'
    }
  };

  return (
    <div className="min-h-screen bg-bgMain">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-navy -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        {/* Bulk Action Toolbar */}
        {selectedResidents.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gold/10 border border-gold/30 rounded-lg flex items-center justify-between"
          >
            <span className="text-sm font-medium text-navy">{selectedResidents.size} resident{selectedResidents.size !== 1 ? 's' : ''} selected</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedResidents(new Set())}
              >
                Clear Selection
              </Button>
              <Button
                size="sm"
                onClick={() => setBulkMessageOpen(true)}
                className="bg-gold text-navy hover:bg-gold/90"
              >
                Send Email
              </Button>
            </div>
          </motion.div>
        )}

        {/* Resident Profile Modal */}
        <ResidentProfileModal
          resident={selectedResident}
          redemptions={redemptions}
          perks={[]}
          open={profileModalOpen}
          onOpenChange={setProfileModalOpen}
        />

        {/* Bulk Message Modal */}
        <Dialog open={bulkMessageOpen} onOpenChange={setBulkMessageOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send Bulk Email</DialogTitle>
              <DialogDescription>
                Send a message to {selectedResidents.size} resident{selectedResidents.size !== 1 ? 's' : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-navy mb-2 block">Subject</label>
                <input
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  placeholder="Email subject"
                  className="w-full px-3 py-2 border border-gold/30 rounded-lg focus:border-gold focus:ring-1 focus:ring-gold/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-navy mb-2 block">Message</label>
                <Textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Email message body"
                  className="w-full px-3 py-2 border border-gold/30 rounded-lg focus:border-gold focus:ring-1 focus:ring-gold/20 h-32 resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setBulkMessageOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSendBulkEmail}
                  disabled={isSending}
                  className="bg-gold text-navy hover:bg-gold/90"
                >
                  {isSending ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Header */}
        <div className="mb-10 p-6 bg-gradient-to-r from-gold/10 to-transparent border border-gold/30 rounded-2xl">
          <h2 className="text-lg font-semibold text-navy mb-2">Resident Segmentation</h2>
          <p className="text-textSecondary text-sm leading-relaxed">
            Analyze your community by engagement level. Identify Power Users, Occasional engagers, and Inactive residents to craft targeted communications and personalized retention strategies.
          </p>
        </div>

        {/* Building context display */}
        {!resolvedBuildingId && (
          <div className="mb-8">
            <label className="block text-sm font-medium text-navy mb-2">Filter by Building</label>
            <p className="text-sm text-textSecondary">Select a building from the main view to filter residents</p>
          </div>
        )}
        {resolvedBuildingId && currentBuilding && (
          <div className="mb-8 p-3 bg-gold/5 border border-gold/20 rounded-lg">
            <p className="text-sm text-navy font-medium">Building: {currentBuilding.name}</p>
          </div>
        )}

        {/* Statistics Cards */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <Card className="border-gold/20 bg-gradient-to-br from-white to-gold/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-textSecondary">Total Residents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy">{stats.total}</div>
                <p className="text-xs text-slate-500">{resolvedBuildingId ? 'In building' : 'All buildings'}</p>
              </CardContent>
            </Card>

            <Card className="border-gold/20 bg-gradient-to-br from-white to-gold/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-textSecondary">Power Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gold">{stats.powerUsers}</div>
                <p className="text-xs text-textMuted">{stats.powerUserRate}% of residents</p>
              </CardContent>
            </Card>

            <Card className="border-gold/20 bg-gradient-to-br from-white to-gold/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-textSecondary">Engagement Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy">{stats.engagementRate}%</div>
                <p className="text-xs text-textMuted">Enrolled residents</p>
              </CardContent>
            </Card>

            <Card className="border-gold/20 bg-gradient-to-br from-white to-gold/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-textSecondary">Inactive</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-textSecondary">{stats.inactive}</div>
                <p className="text-xs text-textMuted">Opportunity pool</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Segments */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-navy" />
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(segments).map(([segmentName, residentList]) => {
              const config = segmentConfig[segmentName];
              const Icon = config.icon;

              return (
                <motion.div
                  key={segmentName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className={cn(config.bgColor, 'p-6 rounded-2xl border', config.borderColor, 'mb-4')}>
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={cn('w-6 h-6', config.color)} />
                      <h3 className="text-xl font-bold text-navy">{segmentName}</h3>
                      <Badge className="bg-navy text-white">{residentList.length}</Badge>
                      {isAdmin && residentList.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSegmentAll(residentList)}
                          className="ml-auto text-xs"
                        >
                          {residentList.every(r => selectedResidents.has(r.id)) ? 'Deselect All' : 'Select All'}
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-textSecondary">{config.description}</p>
                  </div>

                  {residentList.length === 0 ? (
                    <Card className={cn('p-8 text-center', config.bgColor, 'border', config.borderColor)}>
                      <Icon className={cn('w-12 h-12 mx-auto mb-3 opacity-30', config.color)} />
                      <p className="text-textSecondary">No residents in this segment</p>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {residentList.map((resident) => (
                        <Card 
                           key={resident.id} 
                           className={cn('border hover:shadow-lg transition-all cursor-pointer', config.borderColor, config.bgColor, selectedResidents.has(resident.id) && 'ring-2 ring-gold')}
                           onClick={() => { setSelectedResident(resident); setProfileModalOpen(true); }}
                         >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-3">
                              {isAdmin && (
                                <Checkbox
                                  checked={selectedResidents.has(resident.id)}
                                  onCheckedChange={() => toggleResident(resident.id)}
                                  className="mt-1"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base">{resident.name}</CardTitle>
                                <CardDescription className="text-xs">
                                  Flat {resident.flat?.flat_number}
                                </CardDescription>
                              </div>
                              {resident.perks_enrolled && (
                                <Star className="w-4 h-4 text-gold" />
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            {resident.building && (
                              <div className="flex items-center gap-2 text-textSecondary">
                                <Home className="w-3 h-3" />
                                {resident.building.name}
                              </div>
                            )}
                            {resident.email && (
                              <a 
                                href={`mailto:${resident.email}`}
                                className={cn('flex items-center gap-2 hover:underline', config.color)}
                              >
                                <Mail className="w-3 h-3" />
                                <span className="truncate text-xs">{resident.email}</span>
                              </a>
                            )}
                            {resident.mobile_number && (
                              <div className="flex items-center gap-2 text-textSecondary text-xs">
                                <Phone className="w-3 h-3" />
                                {resident.mobile_number}
                              </div>
                            )}
                            {resident.perks_tier && (
                              <div className="text-xs text-textMuted">
                                Tier: <span className="font-semibold text-navy capitalize">{resident.perks_tier}</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}