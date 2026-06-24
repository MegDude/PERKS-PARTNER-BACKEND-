import React from 'react';
import { motion } from 'framer-motion';
import { Home, User, IndianRupee } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from '@/components/context/LanguageContext';

const FlatCard = ({ flat, tenant, onClick }) => {
  const { t } = useLanguage();
  const isPaid = tenant?.payment_status === 'paid';
  const isEmpty = !tenant;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(flat, tenant)}
      className={cn(
        "relative cursor-pointer rounded-xl p-3 transition-all duration-300",
        "border-2 shadow-sm hover:shadow-lg",
        isEmpty && "bg-slate-50 border-slate-200 border-dashed",
        !isEmpty && isPaid && "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300",
        !isEmpty && !isPaid && "bg-gradient-to-br from-red-50 to-rose-50 border-red-300"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold text-slate-800">#{flat.flat_number}</span>
        {!isEmpty && (
          <Badge 
            className={cn(
              "text-xs font-medium",
              isPaid ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"
            )}
          >
            {isPaid ? t('paid') : t('unpaid')}
          </Badge>
        )}
      </div>
      
      {isEmpty ? (
        <div className="flex items-center justify-center py-3">
          <Home className="w-5 h-5 text-slate-300" />
          <span className="ml-2 text-sm text-slate-400">{t('vacant')}</span>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center text-sm text-slate-600">
            <User className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            <span className="truncate">{tenant.name}</span>
          </div>
          <div className="flex items-center text-xs text-slate-500">
            <IndianRupee className="w-3 h-3 mr-1 text-slate-400" />
            <span>{tenant.rent_per_interval?.toLocaleString()}/{tenant.rent_interval_months || 6}m</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const FloorRow = ({ floor, flats, tenants, onFlatClick }) => {
  const { t } = useLanguage();
  const getTenantForFlat = (flatId) => {
    return tenants.find(t => t.flat_id === flatId);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: floor * 0.05 }}
      className="flex items-stretch gap-4"
    >
      <div className="flex items-center justify-center w-16 shrink-0">
        <div className="bg-slate-800 text-white rounded-lg px-3 py-2 text-center">
          <div className="text-xs text-slate-300">{t('floor')}</div>
          <div className="text-xl font-bold">{floor}</div>
        </div>
      </div>
      
      <div className="flex-1 grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {flats.map(flat => (
          <FlatCard
            key={flat.id}
            flat={flat}
            tenant={getTenantForFlat(flat.id)}
            onClick={onFlatClick}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default function DynamicBuildingOverview({ buildings, flats, tenants, onFlatClick }) {
  const { t } = useLanguage();
  
  if (!buildings || buildings.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        {t('noBuildings') || 'No buildings found'}
      </div>
    );
  }

  // Group flats by building and floor
  const buildingFlats = buildings.map(building => {
    const buildingFlatsData = flats.filter(f => f.building_id === building.id);
    const floorGroups = {};
    
    buildingFlatsData.forEach(flat => {
      if (!floorGroups[flat.floor]) {
        floorGroups[flat.floor] = [];
      }
      floorGroups[flat.floor].push(flat);
    });
    
    // Sort floors in descending order
    const sortedFloors = Object.keys(floorGroups)
      .map(Number)
      .sort((a, b) => b - a);
    
    return {
      building,
      floorGroups,
      sortedFloors
    };
  });

  return (
    <div className="space-y-8">
      {buildingFlats.map(({ building, floorGroups, sortedFloors }) => (
        <div key={building.id} className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="p-2 rounded-lg bg-slate-800">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{building.name}</h3>
              <p className="text-sm text-slate-500">{building.address}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {sortedFloors.map(floor => (
              <FloorRow
                key={floor}
                floor={floor}
                flats={floorGroups[floor]}
                tenants={tenants}
                onFlatClick={onFlatClick}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}