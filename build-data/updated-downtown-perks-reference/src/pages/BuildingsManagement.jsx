import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Building2, MapPin, ChevronRight, Plus, Loader2, Users, Star, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BuildingsManagement() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: buildings = [], isLoading } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: flats = [] } = useQuery({
    queryKey: ['flats'],
    queryFn: () => base44.entities.Flat.list()
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list()
  });

  const isAdmin = user?.role === 'admin';

  const getBuildingStats = (buildingId) => {
    const buildingFlats = flats.filter(f => f.building_id === buildingId);
    const buildingTenants = tenants.filter(t => buildingFlats.some(f => f.id === t.flat_id));
    const enrolled = buildingTenants.filter(t => t.perks_enrolled).length;
    return {
      units: buildingFlats.length || null,
      residents: buildingTenants.length,
      enrolled,
    };
  };

  return (
    <div className="min-h-screen bg-bgMain">
      {/* Header */}
      <div className="bg-white border-b border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-textMuted uppercase tracking-widest mb-1">Portfolio</p>
              <h1 className="text-3xl font-bold text-navy">Properties</h1>
              <p className="text-textSecondary text-sm mt-1">{buildings.length} {buildings.length === 1 ? 'property' : 'properties'} in your portfolio</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-textMuted" />
          </div>
        ) : buildings.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Building2 className="w-8 h-8 text-gold" />
            </div>
            <h3 className="text-xl font-bold text-navy mb-2">No properties yet</h3>
            <p className="text-textSecondary text-sm">Properties will appear here once added.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {buildings.map((building) => {
              const stats = getBuildingStats(building.id);
              return (
                <button
                  key={building.id}
                  onClick={() => navigate(`/buildings/${building.id}`)}
                  className="group text-left bg-white rounded-2xl p-6 hover:shadow-[0_8px_32px_rgba(11,31,51,0.12)] transition-all duration-200 hover:-translate-y-0.5 border border-transparent hover:border-gold/20"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="p-3 bg-navy/5 group-hover:bg-navy rounded-xl transition-colors">
                      <Building2 className="w-5 h-5 text-black group-hover:text-white transition-colors" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-textMuted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="font-bold text-navy text-lg mb-1 leading-tight">{building.name}</h3>
                  {building.address && (
                    <p className="text-sm text-textMuted flex items-center gap-1.5 mb-5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {building.address}
                    </p>
                  )}
                  <div className="flex items-center gap-4 pt-4 border-t border-[var(--border-subtle)]">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Users className="w-3.5 h-3.5 text-textMuted" />
                      <span className="font-semibold text-navy">{stats.residents}</span>
                      <span className="text-textMuted">residents</span>
                    </div>
                    {stats.enrolled > 0 && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Star className="w-3.5 h-3.5 text-black" />
                        <span className="font-semibold text-navy">{stats.enrolled}</span>
                        <span className="text-textMuted">perks</span>
                      </div>
                    )}
                    {building.priceTier && (
                      <span className={cn(
                        "ml-auto text-xs font-semibold px-2 py-0.5 rounded-full",
                        building.priceTier === 'luxury' ? 'bg-black/10 text-black' :
                        building.priceTier === 'premium' ? 'bg-blue-50 text-blue-600' :
                        'bg-bgAlt text-textSecondary'
                      )}>
                        {building.priceTier}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}