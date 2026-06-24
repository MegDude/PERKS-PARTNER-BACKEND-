import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Ticket, Search, Filter, ShoppingBag, Utensils, Music, Coffee, Navigation, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';

export default function DowntownPerks() {
  const [perks, setPerks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPerks() {
      try {
        const locations = await base44.entities.PerkLocation.list();
        const partners = await base44.entities.Partner.list();
        
        // Enrich location with partner name
        const enriched = locations.map(loc => {
           const partner = partners.find(p => p.id === loc.partner_id);
           return {
             id: loc.id,
             title: loc.title,
             provider: partner?.business_name || 'Downtown Business',
             category: loc.category,
             description: loc.title,
             status: loc.active ? 'active' : 'inactive',
             redemptions: loc.redemption_count || 0
           };
        });
        
        if (enriched.length > 0) {
           setPerks(enriched);
        } else {
           // Fallback if missing
           setPerks([
             { id: 1, provider: 'Uchi', category: 'dining', description: 'Priority Seating for Residents', status: 'active', redemptions: 450 },
             { id: 2, provider: 'Houndstooth', category: 'coffee', description: '15% Off Your Daily Brew', status: 'active', redemptions: 342 },
             { id: 3, provider: 'Equinox', category: 'fitness', description: 'Waived Initiation Fee', status: 'active', redemptions: 89 },
           ]);
        }
      } catch (error) {
        console.error("Failed to fetch perks:", error);
      } finally {
        setLoading(false);
      }
    }
    
    // Simulate real network fetch
    setTimeout(fetchPerks, 400);
  }, []);

  // Helper to map category to icon
  const getIcon = (category) => {
    switch(category?.toLowerCase()) {
      case 'dining': 
      case 'food & beverage': return <Utensils className="w-5 h-5 text-[#11182B] " />;
      case 'services': return <ShoppingBag className="w-5 h-5 text-[#11182B] " />;
      case 'wellness': 
      case 'fitness': return <Ticket className="w-5 h-5 text-[#11182B] " />;
      default: return <Coffee className="w-5 h-5 text-[#11182B] " />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#11182B] " />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#11182B] tracking-tight">Active Perks</h1>
          <p className="text-slate-500 font-medium mt-1">Manage and measure performance of active resident perks.</p>
        </div>
        <Button className="flex">
          <Ticket className="w-4 h-4 mr-2" /> Add Perk
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {perks.map(p => (
           <div key={p.id} className="bg-white rounded-none border border-[#EFEFEF] p-6 shadow-none hover:shadow-[#11182B]/5 transition-shadow flex flex-col group cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                 <div className="w-10 h-10 rounded-none bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-[#11182B] group-hover:text-white transition-colors">
                    {React.cloneElement(getIcon(p.category), { className: "w-5 h-5 transition-colors group-hover:text-white" })}
                 </div>
                 <div className="text-[9px] font-bold uppercase tracking-widest bg-slate-100 text-[#11182B] px-2 py-1 rounded-none">
                    {p.category || 'Retail'}
                 </div>
              </div>
              <h3 className="font-bold text-[#11182B] mb-1">{p.provider || p.title}</h3>
              <p className="text-sm font-medium text-slate-500 mb-6 flex-1 line-clamp-2">{p.description}</p>
              
              <div className="pt-4 border-t border-[#EFEFEF] grid grid-cols-2 gap-2">
                 <div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</div>
                    <div className="text-sm font-bold capitalize text-[#11182B] ">{p.status}</div>
                 </div>
                 <div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Redeemed</div>
                    <div className="text-sm font-bold text-[#11182B] ">{p.redemptions}</div>
                 </div>
              </div>
           </div>
        ))}
      </div>
      
      {/* Map Insight placeholder area */}
      <div className="bg-[#11182B] rounded-none p-6 text-white flex items-center justify-between shadow-none">
         <div>
            <div className="text-[10px] font-bold text-slate-400 border border-slate-600 w-fit px-2 py-1 mb-3 uppercase tracking-widest flex items-center gap-2">
               <Navigation className="w-3 h-3" /> Map Network
            </div>
            <h3 className="text-xl font-bold">{perks.length} Perks active across your neighborhood radius</h3>
         </div>
         <Button variant="secondary" onClick={() => navigate('/')}>
            View Live Map
         </Button>
      </div>

    </div>
  )
}

