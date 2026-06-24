import React from 'react';
import { motion } from 'framer-motion';
import { Home, User, Phone, Calendar, IndianRupee } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const FlatCard = ({ flat, tenant, onClick }) => {
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
        <span className="text-lg font-bold text-slate-800">#{flat}</span>
        {!isEmpty && (
          <Badge 
            className={cn(
              "text-xs font-medium",
              isPaid ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"
            )}
          >
            {isPaid ? 'Paid' : 'Unpaid'}
          </Badge>
        )}
      </div>
      
      {isEmpty ? (
        <div className="flex items-center justify-center py-3">
          <Home className="w-5 h-5 text-slate-300" />
          <span className="ml-2 text-sm text-slate-400">Vacant</span>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center text-sm text-slate-600">
            <User className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            <span className="truncate">{tenant.name}</span>
          </div>
          <div className="flex items-center text-xs text-slate-500">
            <IndianRupee className="w-3 h-3 mr-1 text-slate-400" />
            <span>{tenant.rent_per_cycle?.toLocaleString()}/{tenant.payment_cycle_months || 6}m</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const FloorRow = ({ floor, flats, tenants, onFlatClick }) => {
  const getTenantForFlat = (flatNum) => {
    return tenants.find(t => t.flat_number === flatNum);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: (6 - floor) * 0.1 }}
      className="flex items-stretch gap-4"
    >
      <div className="flex items-center justify-center w-16 shrink-0">
        <div className="bg-slate-800 text-white rounded-lg px-3 py-2 text-center">
          <div className="text-xs text-slate-300">Floor</div>
          <div className="text-xl font-bold">{floor}</div>
        </div>
      </div>
      
      <div className={cn(
        "flex-1 grid gap-3",
        floor === 1 ? "grid-cols-4" : "grid-cols-4 md:grid-cols-8"
      )}>
        {flats.map(flat => (
          <FlatCard
            key={flat}
            flat={flat}
            tenant={getTenantForFlat(flat)}
            onClick={onFlatClick}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default function BuildingOverview({ tenants, onFlatClick }) {
  const buildingStructure = {
    6: ['61', '62', '63', '64', '65', '66', '67', '68'],
    5: ['51', '52', '53', '54', '55', '56', '57', '58'],
    4: ['41', '42', '43', '44', '45', '46', '47', '48'],
    3: ['31', '32', '33', '34', '35', '36', '37', '38'],
    2: ['21', '22', '23', '24', '25', '26', '27', '28'],
    1: ['11', '12', '13', '14']
  };
  
  return (
    <div className="space-y-4">
      {[6, 5, 4, 3, 2, 1].map(floor => (
        <FloorRow
          key={floor}
          floor={floor}
          flats={buildingStructure[floor]}
          tenants={tenants}
          onFlatClick={onFlatClick}
        />
      ))}
    </div>
  );
}