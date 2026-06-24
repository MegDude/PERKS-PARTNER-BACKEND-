import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, Calendar, MessageCircle, Clock, AlertTriangle,
  Home, User, Gift, Loader2, Send, Star
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useLanguage } from '@/components/context/LanguageContext';

export default function Reminders() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [sendingReminder, setSendingReminder] = useState(null);

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

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list()
  });

  // Demo data for perks enrollment reminders
  const DEMO_PERKS_REMINDERS = [
    { id: '1', name: 'Sarah Johnson', flat_number: '1604', perks_tier: 'standard', perk_name: 'Happy Hour @ The Drunkard', perk_value: '20% off drinks', enrolled: false, days_until_exp: 2 },
    { id: '2', name: 'Michael Chen', flat_number: '2013', perks_tier: 'premium', perk_name: 'Yoga Class @ Studio', perk_value: '5 classes included', enrolled: false, days_until_exp: 1 },
    { id: '3', name: 'Emma Rodriguez', flat_number: '805', perks_tier: 'standard', perk_name: 'Coffee Discount @ Bennu', perk_value: 'Free coffee monthly', enrolled: false, days_until_exp: 3 }
  ];

  // Get reminders - combine real data with demo
  const getPerksReminders = () => {
    const perkReminders = tenants
      .filter(t => !t.perks_enrolled && t.perks_tier !== 'vip')
      .map((t, idx) => ({
        ...t,
        id: t.id,
        perk_name: `Downtown Perk ${idx + 1}`,
        perk_value: 'Exclusive offer',
        enrolled: false,
        days_until_exp: Math.random() > 0.5 ? 1 : Math.floor(Math.random() * 3)
      }));
    
    return tenants.length === 0 ? DEMO_PERKS_REMINDERS : perkReminders;
  };

  const reminders = getPerksReminders();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const sendReminder = (reminder) => {
    setSendingReminder(reminder.id);
    
    let message = `Hi ${reminder.name}! 🎉 You're missing out on "${reminder.perk_name}" - ${reminder.perk_value}. This exclusive Downtown Perk expires in ${reminder.days_until_exp} day${reminder.days_until_exp > 1 ? 's' : ''}. Enroll now to start enjoying resident benefits!`;
    
    const phone = reminder.mobile_number?.replace(/\D/g, '') || '15551234567';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    
    setTimeout(() => setSendingReminder(null), 1000);
  };

  const sendAllReminders = () => {
    reminders.forEach((tenant, idx) => {
      setTimeout(() => sendReminder(tenant), idx * 500);
    });
  };

  const getUrgencyConfig = (days) => {
    if (days === 1) {
      return { label: 'Expires Soon', color: 'bg-red-100 text-red-700', icon: AlertTriangle };
    } else if (days <= 2) {
      return { label: 'Limited Time', color: 'bg-amber-100 text-amber-700', icon: Clock };
    } else {
      return { label: 'New Offer', color: 'bg-blue-100 text-blue-700', icon: Gift };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gold">
              <Gift className="w-7 h-7 text-navy" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy">Downtown Perks Reminders</h1>
              <p className="text-sm text-textSecondary">
                {reminders.length} residents haven't claimed their perks
              </p>
            </div>
          </div>
          
          {reminders.length > 0 && (
            <Button 
             onClick={sendAllReminders}
             className="bg-gold text-navy hover:bg-goldSoft"
           >
             <Send className="w-4 h-4 mr-2" />
             Remind All
           </Button>
          )}
        </motion.div>

        {/* Info Card */}
         <Card className="p-4 mb-6 bg-gold/10 border-gold/30">
           <div className="flex items-start gap-3">
             <div className="p-2 rounded-lg bg-gold/20">
               <Star className="w-5 h-5 text-gold" />
             </div>
             <div>
               <h3 className="font-medium text-navy">Boost Downtown Perks Adoption</h3>
               <p className="text-sm text-textSecondary mt-1">
                 Send friendly reminders to residents who haven't activated their exclusive Downtown Perks yet. Higher engagement means happier residents!
               </p>
             </div>
           </div>
         </Card>

        {/* Reminders List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : reminders.length === 0 ? (
           <Card className="p-12 text-center">
             <div className="p-4 rounded-full bg-gold/20 w-fit mx-auto mb-4">
               <Gift className="w-8 h-8 text-gold" />
             </div>
             <h3 className="text-lg font-semibold text-navy">All Residents Enrolled!</h3>
             <p className="text-textSecondary mt-1">Every resident is already enjoying Downtown Perks</p>
           </Card>
         ) : (
          <div className="space-y-4">
            {reminders.map((reminder, idx) => {
              const urgencyConfig = getUrgencyConfig(reminder.days_until_exp);
              const UrgencyIcon = urgencyConfig.icon;
              
              return (
                <motion.div
                  key={reminder.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={cn(
                    "p-5 border-l-4 transition-all hover:shadow-md",
                    reminder.days_until_exp === 1 && "border-l-red-500",
                    reminder.days_until_exp === 2 && "border-l-amber-500",
                    reminder.days_until_exp > 2 && "border-l-gold"
                  )}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "p-3 rounded-xl",
                          reminder.days_until_exp === 1 && "bg-red-100",
                          reminder.days_until_exp === 2 && "bg-amber-100",
                          reminder.days_until_exp > 2 && "bg-gold/20"
                        )}>
                          <Gift className={cn(
                            "w-6 h-6",
                            reminder.days_until_exp === 1 && "text-red-600",
                            reminder.days_until_exp === 2 && "text-amber-600",
                            reminder.days_until_exp > 2 && "text-gold"
                          )} />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-lg text-navy">Flat #{reminder.flat_number}</span>
                            <Badge className={urgencyConfig.color}>
                              <UrgencyIcon className="w-3 h-3 mr-1" />
                              {urgencyConfig.label}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <span className="flex items-center gap-1 text-sm text-navy font-semibold">
                              <Star className="w-4 h-4 text-gold" />
                              {reminder.perk_name}
                            </span>
                            <span className="text-sm text-textSecondary">
                              {reminder.name} • {reminder.perk_value}
                            </span>
                          </div>
                          
                          <p className="text-xs text-textMuted mt-2">
                            Offer expires in {reminder.days_until_exp} day{reminder.days_until_exp > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => sendReminder(reminder)}
                        disabled={sendingReminder === reminder.id}
                        className="bg-gold text-navy hover:bg-goldSoft shrink-0"
                      >
                        {sendingReminder === reminder.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Send Reminder
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}