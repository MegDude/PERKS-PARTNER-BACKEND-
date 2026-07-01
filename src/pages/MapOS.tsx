import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  Building2, MapPin, Zap, Target, Search, Sparkles, SlidersHorizontal,
  ChevronDown, ChevronUp, UserCircle, LogOut, Ticket, Star, Navigation, 
  Check, X, ChevronRight, Activity, PieChart, BarChart3, Presentation
} from 'lucide-react';
import UnifiedMapShell from '../components/map/unified/UnifiedMapShell';
import { mapEntities } from '../data/sampleMapEntities';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

type Mode = 'resident' | 'intelligence';

const filters = ['All', 'Property', 'Real Estate', 'Venue', 'Hotel', 'Brand', 'Event', 'Campaign', 'Perk', 'Civic', 'Service'];

export default function MapOS() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('resident');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  
  const [savedEntities, setSavedEntities] = useState<Set<string>>(new Set());
  const [rsvpedEntities, setRsvpedEntities] = useState<Set<string>>(new Set());
  const [trackedPartners, setTrackedPartners] = useState<Set<string>>(new Set());
  const [showResidentCard, setShowResidentCard] = useState(false);
  const [showCampaignBuilder, setShowCampaignBuilder] = useState(false);
  const { data: liveMapRows = [] } = useQuery({
    queryKey: ['live-map-entities'],
    queryFn: async () => {
      const response = await fetch('/api/map/entities');
      if (!response.ok) throw new Error('Map could not load');
      return response.json();
    },
    refetchInterval: 5000,
  });
  
  // Handlers
  const trackEvent = (eventName: string, payload: any) => {
    window.dispatchEvent(new CustomEvent('dp-map-analytics', { detail: { eventName, payload, created_at: new Date().toISOString() } }));
  };

  const handleSave = (id: string) => {
    setSavedEntities(prev => {
      const next = new Set(prev);
      const isSaved = !next.has(id);
      if (isSaved) next.add(id); else next.delete(id);
      trackEvent('save_clicked', { entityId: id, saved: isSaved });
      return next;
    });
  };

  const handleRsvp = (id: string) => {
    setRsvpedEntities(prev => {
      const next = new Set(prev);
      const isRsvped = !next.has(id);
      if (isRsvped) next.add(id); else next.delete(id);
      trackEvent('rsvp_clicked', { entityId: id, rsvped: isRsvped });
      return next;
    });
  };

  const handleTrackPartner = (id: string) => {
    setTrackedPartners(prev => {
      const next = new Set(prev);
      const isTracked = !next.has(id);
      if (isTracked) next.add(id); else next.delete(id);
      trackEvent('partner_tracked', { entityId: id, tracked: isTracked });
      return next;
    });
  };

  const handleRedeem = (id: string) => {
    trackEvent('redemption_opened', { entityId: id });
    setShowResidentCard(true);
  };

  const handleDirections = (id: string) => {
    trackEvent('directions_clicked', { entityId: id });
  };

  // Filter entities
  const liveEntities = (Array.isArray(liveMapRows) && liveMapRows.length ? liveMapRows : mapEntities)
    .map((entity: any) => ({
      ...entity,
      id: entity.id || entity.entity_id,
      name: entity.name || entity.title || 'Downtown place',
      type: normalizeMapType(entity.entity_type || entity.type || entity.category),
      category: entity.category || entity.entity_type || entity.type || 'Place',
      description: entity.description || entity.content?.summary || entity.status || '',
      lat: Number(entity.lat),
      lng: Number(entity.lng),
      perk: entity.perk || entity.entity_type === 'perk',
      stats: entity.stats || entity.analytics_summary || {},
    }))
    .filter((entity: any) => Number.isFinite(entity.lat) && Number.isFinite(entity.lng));

  const filteredEntities = liveEntities.filter(e => {
    if (selectedFilter !== 'All' && e.type !== selectedFilter && e.category !== selectedFilter) return false;
    if (searchQuery && !e.name.toLowerCase().includes(searchQuery.toLowerCase()) && !e.category.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex h-[100dvh] w-full font-sans text-slate-900 overflow-hidden relative">
      
      {/* 1. Map Base Layer */}
      <UnifiedMapShell entities={filteredEntities} selectedEntity={selectedEntity} onEntitySelect={setSelectedEntity} />

      {/* 2. Top Control Overlay (Pointer events pass through where empty) */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col">
        
        {/* Top Header Row */}
        <div className="p-4 flex justify-between items-start pointer-events-none w-full">
          <div className="w-12" /> {/* spacer */}
          
          {/* Mode Switcher */}
          <div className="bg-white/90 backdrop-blur-md rounded-none shadow-none border border-[#EFEFEF]/50 p-1 flex items-center pointer-events-auto">
            <Button 
              onClick={() => { setMode('resident'); trackEvent('mode_switched', { mode: 'resident' }); }}
              className={`px-4 py-1.5 rounded-none text-xs font-bold transition-all ${mode === 'resident' ? 'bg-[#11182B] text-white shadow-none' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Resident
            </Button>
            <Button 
              onClick={() => { setMode('intelligence'); trackEvent('mode_switched', { mode: 'intelligence' }); }}
              className={`px-4 py-1.5 rounded-none text-xs font-bold transition-all flex items-center gap-1.5 ${mode === 'intelligence' ? 'bg-[#11182B] text-white shadow-none' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Assistant
              {mode === 'intelligence' && <Sparkles className="w-3.5 h-3.5 text-[#11182B] " />}
            </Button>
          </div>
          
          {/* Profile */}
          <Button onClick={() => navigate('/admin')} className="h-8 w-8 bg-[#11182B] rounded-none shadow-none flex items-center justify-center text-white hover:bg-[#1a243d] transition-colors pointer-events-auto">
            <Building2 className="w-4 h-4 text-white" />
          </Button>
        </div>

        {/* Search & Results Panel */}
        {mode === 'intelligence' && (
          <div className="flex-1 px-4 pb-4 flex flex-col max-w-sm pointer-events-none relative transition-all duration-300">
             <div className={`bg-white rounded-none shadow-none border border-[#EFEFEF] pointer-events-auto flex flex-col transition-all duration-300 overflow-hidden h-full max-h-full`}>
                {/* Search & Header */}
                <div className="p-4 border-b border-slate-100 shrink-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Map helper</div>
                  <h2 className="text-xl font-bold text-[#11182B] mb-3 leading-tight tracking-tight">
                    Where should we drive more customers?
                  </h2>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input 
                      type="text" 
                      placeholder="Search building sectors..." 
                      className="w-full bg-slate-50 border border-[#EFEFEF] rounded-none pl-9 pr-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#11182B]/10 transition-shadow text-[#11182B] placeholder:text-slate-400"
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); trackEvent('search_submitted', { query: e.target.value }); }}
                    />
                    <Button className="absolute right-3 top-2 text-slate-400 hover:text-[#11182B] " variant="ghost">
                      <SlidersHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Filters */}
                <div className="px-4 py-2.5 border-b border-slate-100 shrink-0 overflow-x-auto hide-scrollbar flex gap-2">
                  {filters.map(filter => (
                    <Button 
                      key={filter} 
                      onClick={() => { setSelectedFilter(filter); trackEvent('filter_selected', { filter }); }}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-none text-xs font-bold transition-all border ${
                        selectedFilter === filter 
                          ? 'bg-[#11182B] text-white border-[#11182B]' 
                          : 'bg-white text-slate-500 border-[#EFEFEF] hover:border-slate-300'
                      }`}
                    >
                      {filter}
                    </Button>
                  ))}
                </div>

                {/* Utility Row */}
                <div className="px-4 py-2.5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#11182B] ">Activity Intel</span>
                    <Button 
                      onClick={() => setShowCampaignBuilder(true)}
                      className="px-2.5 py-1 bg-[#11182B] text-white text-[10px] uppercase tracking-widest font-bold rounded flex items-center gap-1 hover:bg-[#1a243d] transition-colors"
                    >
                      <Zap className="w-3 h-3 text-[#11182B] " /> Build Campaign
                    </Button>
                  </div>
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-[#11182B] p-2.5 rounded-none text-white border border-[#11182B]/20 border-b-2 border-b-[#C5A028]">
                      <div className="text-[9px] uppercase tracking-widest text-[#8e9bb0] mb-0.5">Live Reach</div>
                      <div className="text-sm font-bold">12,943</div>
                    </div>
                    <div className="bg-[#11182B] p-2.5 rounded-none text-white border border-[#11182B]/20">
                      <div className="text-[9px] uppercase tracking-widest text-[#8e9bb0] mb-0.5">Partner Conv</div>
                      <div className="text-sm font-bold">14.2%</div>
                    </div>
                    <div className="bg-[#11182B] p-2.5 rounded-none text-white border border-[#11182B]/20">
                      <div className="text-[9px] uppercase tracking-widest text-[#8e9bb0] mb-0.5">Utility</div>
                      <div className="text-sm font-bold">2,433</div>
                    </div>
                  </div>

                  {filteredEntities.map((entity) => (
                    <div 
                      key={entity.id} 
                      onClick={() => setSelectedEntity(entity)}
                      className="block bg-white border border-[#EFEFEF] p-4 rounded-none hover:border-slate-300 transition-all cursor-pointer shadow-none"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-[#11182B] ">{entity.name}</h3>
                          <span className="px-1.5 py-0.5 bg-slate-50 text-[#11182B] text-[9px] font-bold uppercase tracking-widest rounded-none">Live</span>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">{entity.distance}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold mb-3">{entity.type}</div>

                      <div className="grid grid-cols-3 gap-2 mb-3 bg-slate-50 p-2 rounded-none border border-slate-100">
                         <div><div className="text-[9px] text-[#8e9bb0] uppercase tracking-widest font-bold">Reach</div><div className="text-xs font-bold text-[#11182B] ">{entity.reach}</div></div>
                         <div><div className="text-[9px] text-[#8e9bb0] uppercase tracking-widest font-bold">Yield</div><div className="text-xs font-bold text-[#11182B] ">{entity.yield}</div></div>
                         <div><div className="text-[9px] text-[#8e9bb0] uppercase tracking-widest font-bold">Impact</div><div className="text-xs font-bold text-[#11182B] ">{entity.impact}</div></div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={(e: any) => { e.stopPropagation(); handleTrackPartner(entity.id); }}
                          className={`flex-1 py-1.5 rounded-none text-[10px] font-bold uppercase tracking-widest transition-colors ${trackedPartners.has(entity.id) ? 'bg-[#11182B] text-white ' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                          {trackedPartners.has(entity.id) ? 'Tracked' : 'Track Performance'}
                        </Button>
                        <Button 
                          onClick={(e: any) => { e.stopPropagation(); setSelectedEntity(entity); }}
                          className="flex-1 py-1.5 bg-white border border-[#EFEFEF] rounded-none text-[10px] font-bold text-[#11182B] uppercase tracking-widest hover:bg-slate-50 transition-colors"
                        >
                          View Intel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Resident Bottom Scroller */}
      {mode === 'resident' && !selectedEntity && (
        <div className="absolute bottom-6 w-full z-[1000] overflow-x-auto pb-4 pointer-events-auto snap-x snap-mandatory flex gap-4 px-4 hide-scrollbar">
          {filteredEntities.map((entity) => (
            <div key={entity.id} onClick={() => setSelectedEntity(entity)} className="snap-center shrink-0 w-[280px] sm:w-[320px] opacity-100 transform-none">
              <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-[rgba(11,31,51,0.08)] p-5 flex flex-col gap-3 h-full cursor-pointer hover:border-[#11182B] transition-colors block">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-semibold text-[16px] text-[#11182B] leading-tight">{entity.name}</h4>
                    <p className="text-[13px] text-slate-500 capitalize flex items-center gap-1 mt-1 font-medium">{entity.type} • {entity.distance}</p>
                  </div>
                  {entity.perk && (
                     <div className="bg-orange-50 text-[#11182B] p-2 rounded-none shrink-0">
                       <Ticket className="w-4 h-4" />
                     </div>
                  )}
                </div>
                
                {entity.perk ? (
                  <div className="bg-slate-50 rounded-none p-3 flex gap-2 items-start text-[13px] text-slate-600 font-medium leading-snug">
                    <Sparkles className="w-3.5 h-3.5 text-[#11182B] shrink-0 mt-0.5" />
                    <p>Nearby, active now, and resident perk available.</p>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-none p-3 flex gap-2 items-start text-[13px] text-slate-600 font-medium leading-snug line-clamp-2">
                    <p>{entity.description}</p>
                  </div>
                )}
                
                <div className="mt-auto pt-2 flex gap-2">
                  {entity.perk ? (
                    <Button onClick={(e: any) => { e.stopPropagation(); handleRedeem(entity.id); }} className="flex-1" variant="primary">Redeem</Button>
                  ) : (
                    <Button onClick={(e: any) => { e.stopPropagation(); handleDirections(entity.id); }} className="flex-1" variant="primary">Directions</Button>
                  )}
                  <Button 
                    onClick={(e: any) => { e.stopPropagation(); handleSave(entity.id); }} 
                    className="flex-1" variant="secondary"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Entity Bottom Drawer */}
      {selectedEntity && (
        <div className="fixed bottom-0 left-0 right-0 z-[1000] p-4 pointer-events-none flex justify-center pb-8">
           <div className="w-full max-w-xl bg-white rounded-t-3xl sm:rounded-none shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border border-[#EFEFEF] pointer-events-auto flex flex-col overflow-hidden max-h-[80vh] transition-transform animate-in slide-in-from-bottom-10">
             
             {/* Header */}
             <div className="relative h-32 bg-[#11182B] shrink-0 p-6 flex flex-col justify-end">
               <Button onClick={() => setSelectedEntity(null)} className="absolute top-4 right-4 text-white hover:text-white bg-white/20 rounded-none p-2" variant="ghost"><X className="w-5 h-5" /></Button>
               <div className="text-[10px] text-white/70 uppercase tracking-widest font-bold mb-1">{selectedEntity.type}</div>
               <h2 className="text-2xl font-bold text-white ">{selectedEntity.name}</h2>
             </div>

             <div className="flex-1 overflow-y-auto p-6 space-y-6">
               <p className="text-[15px] leading-relaxed text-slate-600 font-medium">
                 {selectedEntity.description || "A renowned downtown location providing exceptional experiences and services."}
               </p>

               {selectedEntity.perk && mode === 'resident' && (
                 <div className="bg-slate-50 p-5 rounded-none border border-[#11182B]/30 relative overflow-hidden">
                   <div className="text-[10px] font-bold uppercase tracking-widest text-[#11182B] mb-2 flex items-center gap-2">
                     <Ticket className="w-4 h-4" /> Active Perk
                   </div>
                   <h3 className="text-lg font-bold text-[#11182B] mb-2">{selectedEntity.perk}</h3>
                   <Button 
                     onClick={() => handleRedeem(selectedEntity.id)}
                     className="w-full mt-2 py-3 bg-[#11182B] text-white rounded-none font-bold text-xs uppercase tracking-widest hover:bg-[#1a243d] transition-colors"
                   >
                     Redeem Reward
                   </Button>
                 </div>
               )}

               <div className="flex gap-3">
                 <Button onClick={() => handleDirections(selectedEntity.id)} className="flex-1 py-3 border border-[#EFEFEF] text-[#11182B] rounded-none text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 bg-white">
                   <Navigation className="w-4 h-4" /> Directions
                 </Button>
                 <Button 
                    onClick={() => handleSave(selectedEntity.id)}
                    className={`px-6 flex flex-col items-center justify-center rounded-none border transition-colors bg-white ${savedEntities.has(selectedEntity.id) ? 'border-[#11182B] text-[#11182B] bg-orange-50/20' : 'border-[#EFEFEF] text-slate-400 hover:bg-slate-50'}`}
                 >
                    <Star className={`w-5 h-5 ${savedEntities.has(selectedEntity.id) ? 'fill-current text-[#11182B] ' : ''}`} />
                 </Button>
               </div>
             </div>
           </div>
        </div>
      )}

      {/* Campaign Builder Modal */}
      {showCampaignBuilder && mode === 'intelligence' && (
        <div className="fixed inset-0 z-50 bg-[#11182B]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-none w-full max-w-2xl overflow-hidden shadow-none flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#11182B] text-white ">
              <div>
                <div className="text-[10px] font-bold text-[#11182B] uppercase tracking-widest mb-1 flex items-center gap-2"><Zap className="w-3 h-3" /> Campaign Engine</div>
                <h2 className="text-xl font-bold">Create a new local campaign</h2>
              </div>
              <Button variant="ghost" onClick={() => setShowCampaignBuilder(false)} className="text-white bg-transparent hover:text-white hover:bg-white/10 p-2"><X className="w-5 h-5" /></Button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 space-y-8">
              {/* Step 1: Goal */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#11182B] uppercase tracking-widest border-b border-slate-100 pb-2">1. What are you trying to improve?</h3>
                <div className="grid grid-cols-2 gap-3">
                  {['Bring in new customers', 'Give regulars a reason to come back', 'Fill a slow time', 'Promote an event', 'Reach nearby residents'].map((opt, i) => (
                    <Button 
                      key={opt} 
                      onClick={() => trackEvent('campaign_goal_selected', { goal: opt })}
                      className={`p-4 rounded-none border font-semibold text-sm text-left transition-all ${i === 2 ? 'bg-[#11182B] text-white border-[#11182B]' : 'bg-white border-[#EFEFEF] text-[#11182B] hover:border-slate-300'}`}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Step 2: Audience */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#11182B] uppercase tracking-widest border-b border-slate-100 pb-2">2. Who should see this first?</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Nearby residents', desc: 'Living within a short walk. Best for repeat-use.'},
                    { label: 'Verified residents', desc: 'Active DP profiles. Best for loyalty.'},
                    { label: 'New move-ins', desc: 'Exploring routines. Best for orientation.'},
                    { label: 'Office workers', desc: 'Active during workdays. Best for lunch.'}
                  ].map((opt, i) => (
                    <Button 
                      key={opt.label} 
                      onClick={() => trackEvent('campaign_audience_selected', { audience: opt.label })}
                      className={`p-4 rounded-none border font-semibold text-sm text-left transition-all flex flex-col gap-1 ${i === 0 ? 'bg-[#11182B] text-white border-[#11182B]' : 'bg-white border-[#EFEFEF] text-[#11182B] hover:border-slate-300'}`}
                    >
                      <span>{opt.label}</span>
                      <span className={`text-xs font-medium ${i === 0 ? 'text-white/70' : 'text-slate-500'}`}>{opt.desc}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Step 3: Offer */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#11182B] uppercase tracking-widest border-b border-slate-100 pb-2">3. What perk should people see?</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Offer Title</label>
                    <input type="text" className="w-full border border-[#EFEFEF] rounded-none px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-[#11182B]" placeholder="e.g. 20% Off Weekday Lunch" defaultValue="15% Off Your First Visit" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Timing</label>
                      <input type="text" className="w-full border border-[#EFEFEF] rounded-none px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-[#11182B]" placeholder="e.g. Weekdays 2PM-5PM" defaultValue="Mon-Wed, 4PM-7PM" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Redemption Method</label>
                      <input type="text" className="w-full border border-[#EFEFEF] rounded-none px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-[#11182B]" placeholder="e.g. Show QR Code" defaultValue="Show Resident Card" />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
               <div className="text-sm font-medium text-slate-500">
                 Draft saved <Sparkles className="w-3 h-3 inline-block text-[#11182B] " />
               </div>
               <div className="flex gap-3">
                 <Button variant="ghost" onClick={() => setShowCampaignBuilder(false)} className="px-6 py-2.5 rounded-none text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancel</Button>
                 <Button onClick={() => { trackEvent('campaign_launched', { goal: 'Bring in new customers' }); setShowCampaignBuilder(false); }} className="px-8 py-2.5 rounded-none text-sm font-bold bg-[#11182B] text-white hover:bg-[#1a243d] transition-colors shadow-none flex items-center gap-2">
                   Launch Campaign <ChevronRight className="w-4 h-4" />
                 </Button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Resident Card Dock */}
      {showResidentCard && mode === 'resident' && selectedEntity && (
        <div className="fixed inset-0 z-50 bg-[#11182B]/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-none w-full max-w-sm overflow-hidden shadow-none relative">
            <Button onClick={() => setShowResidentCard(false)} className="absolute top-4 right-4 text-slate-400 hover:text-[#11182B] z-10 bg-slate-100 rounded-none p-2"><X className="w-4 h-4" /></Button>
            <div className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-[#11182B] rounded-none flex items-center justify-center mb-6 shadow-none">
                 <span className="text-[#11182B] font-black text-2xl tracking-tighter">DP</span>
              </div>
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Verified Resident Card</h2>
              <div className="text-2xl font-black text-[#11182B] leading-none mb-8 tracking-tight">John Doe</div>
              
              <div className="w-48 h-48 bg-slate-100 rounded-none mb-8 border-4 border-[#11182B] flex items-center justify-center relative">
                 <div className="absolute inset-0 p-4">
                    <div className="w-full h-full" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #11182B 25%, transparent 25%, transparent 75%, #11182B 75%, #11182B), repeating-linear-gradient(45deg, #11182B 25%, #F5F7FA 25%, #F5F7FA 75%, #11182B 75%, #11182B)', backgroundPosition: '0 0, 8px 8px', backgroundSize: '16px 16px', opacity: '0.8'}}></div>
                    <div className="absolute inset-2 bg-white flex items-center justify-center font-bold text-[#11182B] text-[10px] uppercase tracking-widest text-center px-4 z-10 border-2 border-[#11182B]">
                       {JSON.stringify({
                         type: 'perk_redemption',
                         partnerId: selectedEntity.id,
                         entity: selectedEntity.name
                       }).slice(0, 40)}...
                    </div>
                 </div>
              </div>

              <div className="w-full bg-[#11182B] text-white p-4 rounded-none text-left shadow-inner">
                 <div className="text-[9px] text-[#11182B] font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5"><Ticket className="w-3 h-3" /> Active Offer</div>
                 <div className="font-bold text-sm mb-1">{selectedEntity.perk}</div>
                 <div className="text-[11px] text-white/70 font-semibold">{selectedEntity.name}</div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-6">Show this code to staff to verify.</p>
              
              <Button 
                onClick={() => { trackEvent('redemption_confirmed', { entityId: selectedEntity.id }); setShowResidentCard(false); }}
                className="mt-6 w-full py-3 bg-[#11182B] text-white rounded-none font-bold text-sm uppercase tracking-widest hover:bg-[#1a243d] transition-colors"
              >
                Confirm Redemption
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function normalizeMapType(value?: string) {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('event')) return 'Event';
  if (raw.includes('campaign')) return 'Campaign';
  if (raw.includes('passport')) return 'Event';
  if (raw.includes('perk')) return 'Perk';
  if (raw.includes('property') || raw.includes('building') || raw.includes('real estate')) return 'Property';
  if (raw.includes('hotel')) return 'Hotel';
  if (raw.includes('brand')) return 'Brand';
  if (raw.includes('civic')) return 'Civic';
  if (raw.includes('service')) return 'Service';
  return value || 'Venue';
}
