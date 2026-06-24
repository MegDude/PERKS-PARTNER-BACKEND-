import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Award, DollarSign, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function ResidentProfileModal({ resident, redemptions = [], perks = [], open, onOpenChange }) {
  if (!resident) return null;

  // Filter redemptions for this resident
  const residentRedemptions = redemptions.filter(r => r.user_email === resident.email);

  // Calculate category preferences
  const categoryCount = {};
  residentRedemptions.forEach(r => {
    const category = r.perk_category || 'Other';
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });

  const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Calculate total lifetime savings (estimated ~$15 per redemption as placeholder)
  const estimatedSavingsPerRedemption = 15;
  const totalSavings = residentRedemptions.length * estimatedSavingsPerRedemption;

  // Get recent redemptions (last 5)
  const recentRedemptions = residentRedemptions
    .sort((a, b) => new Date(b.redeemed_at) - new Date(a.redeemed_at))
    .slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{resident.name}</DialogTitle>
          <DialogDescription>
            Flat {resident.flat?.flat_number} • {resident.building?.name || 'Property'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-gold/10 to-transparent border-gold/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-textSecondary">Total Redemptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy">{residentRedemptions.length}</div>
                <p className="text-xs text-textMuted">lifetime perks used</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gold/10 to-transparent border-gold/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-textSecondary">Est. Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gold">${totalSavings}</div>
                <p className="text-xs text-textMuted">value received</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-navy/5 to-transparent border-navy/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-textSecondary">Member Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold text-navy">
                  {resident.perks_tier ? resident.perks_tier.charAt(0).toUpperCase() + resident.perks_tier.slice(1) : 'Standard'}
                </div>
                <p className="text-xs text-textMuted">{resident.perks_enrolled ? 'Active' : 'Inactive'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Preferred Categories */}
          {topCategories.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-navy mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gold" />
                Preferred Perk Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {topCategories.map(([category, count]) => (
                  <Badge key={category} variant="outline" className="bg-gold/10 border-gold/30">
                    {category} <span className="ml-1 text-xs">({count})</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-bgAlt rounded-lg border border-[var(--border-subtle)]">
            <div>
              <p className="text-xs font-medium text-textMuted uppercase">Email</p>
              <p className="text-sm text-navy truncate">{resident.email}</p>
            </div>
            {resident.mobile_number && (
              <div>
                <p className="text-xs font-medium text-textMuted uppercase">Phone</p>
                <p className="text-sm text-navy">{resident.mobile_number}</p>
              </div>
            )}
          </div>

          {/* Recent Redemptions */}
          <div>
            <h3 className="text-sm font-semibold text-navy mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-gold" />
              Recent Activity
            </h3>

            {recentRedemptions.length === 0 ? (
              <Card className="p-4 text-center text-textSecondary">
                <p className="text-sm">No redemptions yet</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {recentRedemptions.map((redemption, idx) => (
                  <Card key={idx} className="p-3 border-gold/20 bg-gradient-to-r from-gold/5 to-transparent">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-navy truncate">{redemption.perk_name}</p>
                        <p className="text-xs text-textMuted">{redemption.perk_category}</p>
                      </div>
                      <p className="text-xs text-textMuted ml-2 whitespace-nowrap">
                        {redemption.redeemed_at ? format(new Date(redemption.redeemed_at), 'MMM d, yyyy') : 'Unknown date'}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Engagement Tier */}
          <div className="p-4 bg-navy/5 rounded-lg border border-navy/20">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-navy" />
              <p className="text-sm font-medium text-navy">Engagement Level</p>
            </div>
            <p className="text-xs text-textSecondary">
              {resident.perks_enrolled 
                ? residentRedemptions.length >= 10 
                  ? '🔥 Power user - consistently engaged with perks'
                  : residentRedemptions.length >= 3
                  ? '✨ Active - regularly discovering local offers'
                  : '👀 Getting started - exploring perks program'
                : '💤 Not enrolled - invite to Downtown Perks'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}