import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, Phone, Home, IndianRupee, Calendar, 
  CheckCircle, Edit, Trash2, MessageCircle, Loader2,
  Building2
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3">
    <div className="p-2 rounded-lg bg-slate-100">
      <Icon className="w-4 h-4 text-slate-600" />
    </div>
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  </div>
);

export default function TenantDetailsSheet({ 
  open, 
  onClose, 
  tenant, 
  onEdit, 
  onDelete,
  onMarkPaid,
  isUpdating,
  isAdmin = false
}) {
  if (!tenant) return null;
  
  const isPaid = tenant.payment_status === 'paid';
  
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-3">
            <div className={cn(
              "p-3 rounded-xl",
              isPaid ? "bg-emerald-100" : "bg-red-100"
            )}>
              <Home className={cn(
                "w-6 h-6",
                isPaid ? "text-emerald-600" : "text-red-600"
              )} />
            </div>
            <div>
              <span className="text-xl">Flat #{tenant.flat_number}</span>
              <Badge 
                className={cn(
                  "ml-2",
                  isPaid ? "bg-emerald-500" : "bg-red-500"
                )}
              >
                {isPaid ? 'Paid' : 'Unpaid'}
              </Badge>
            </div>
          </SheetTitle>
        </SheetHeader>
        
        <div className="space-y-1">
          <InfoRow icon={User} label="Tenant Name" value={tenant.name} />
          <InfoRow icon={Phone} label="Mobile Number" value={tenant.mobile_number} />
          <InfoRow icon={Building2} label="Floor" value={`Floor ${tenant.floor}`} />
          <InfoRow icon={Home} label="Layout" value={tenant.layout} />
          <InfoRow 
            icon={IndianRupee} 
            label="Yearly Rent" 
            value={`₹${tenant.yearly_rent?.toLocaleString()}`} 
          />
          <InfoRow 
            icon={IndianRupee} 
            label={`Rent Per Cycle (${tenant.payment_cycle_months || 6} months)`}
            value={`₹${tenant.rent_per_cycle?.toLocaleString()}`} 
          />
          <InfoRow 
            icon={Calendar} 
            label="Payment Cycle" 
            value={`Every ${tenant.payment_cycle_months || 6} month${(tenant.payment_cycle_months || 6) > 1 ? 's' : ''}`} 
          />
          {tenant.last_payment_date && (
            <InfoRow 
              icon={CheckCircle} 
              label="Last Payment" 
              value={new Date(tenant.last_payment_date).toLocaleDateString()} 
            />
          )}
          {tenant.next_payment_date && (
            <InfoRow 
              icon={Calendar} 
              label="Next Payment Due" 
              value={new Date(tenant.next_payment_date).toLocaleDateString()} 
            />
          )}
        </div>
        
        <Separator className="my-6" />
        
        <div className="space-y-3">
          {!isPaid && (
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700 h-12"
                onClick={onMarkPaid}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Mark as Paid & Send Receipt
              </Button>
            </motion.div>
          )}
          
          {isAdmin && (
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-11"
                onClick={onEdit}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                className="h-11 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </Button>
            </div>
          )}
          
          <Button 
            variant="ghost" 
            className="w-full h-11 text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={() => window.open(`https://wa.me/${tenant.mobile_number.replace(/\D/g, '')}`, '_blank')}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat on WhatsApp
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}