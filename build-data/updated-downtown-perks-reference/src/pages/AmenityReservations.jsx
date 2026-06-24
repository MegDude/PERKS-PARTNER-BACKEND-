import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, ExternalLink, Star, Search, Loader2, 
  Coffee, Utensils, Zap, Gift
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS = {
  'Coffee': Coffee,
  'Restaurant': Utensils,
  'Bar/Nightlife': Zap,
  'default': Gift
};

export default function AmenityReservations() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [enrolledPerks, setEnrolledPerks] = useState([]);

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

  const { data: perks = [], isLoading } = useQuery({
    queryKey: ['perks'],
    queryFn: () => base44.entities.PerkLocation.list()
  });

  // Filter perks
  const filteredPerks = perks.filter(perk => {
    const matchesSearch = 
      perk.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perk.perk?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || perk.category_key === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = [...new Set(perks.map(p => p.category_key))].sort();

  const toggleEnrollment = (perkId) => {
    if (enrolledPerks.includes(perkId)) {
      setEnrolledPerks(enrolledPerks.filter(id => id !== perkId));
    } else {
      setEnrolledPerks([...enrolledPerks, perkId]);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgMain">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgMain">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-black">
              <Star className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy tracking-tight">Downtown Perks</h1>
              <p className="text-sm text-textSecondary">Exclusive benefits at your favorite local venues</p>
            </div>
          </div>
        </motion.div>

        {/* Enrollment Badge */}
        {enrolledPerks.length > 0 && (
          <Card className="p-4 mb-6 bg-gray-100 border-gray-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-black">Perks Enrolled</h3>
                <p className="text-sm text-textSecondary">You've activated {enrolledPerks.length} perk{enrolledPerks.length > 1 ? 's' : ''}</p>
              </div>
              <Badge className="bg-black text-white">{enrolledPerks.length}</Badge>
            </div>
          </Card>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-textMuted" />
            <Input
              placeholder="Search perks or venues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-300 focus:border-black focus:ring-black/20"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-black focus:border-black focus:ring-1 focus:ring-black/20"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Perks Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-navy" />
          </div>
        ) : filteredPerks.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="p-4 rounded-full bg-gold/20 w-fit mx-auto mb-4">
              <Star className="w-8 h-8 text-gold" />
            </div>
            <h3 className="text-lg font-semibold text-navy">No Perks Found</h3>
            <p className="text-textSecondary mt-1">Try adjusting your search or filters</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPerks.map((perk, idx) => {
              const isEnrolled = enrolledPerks.includes(perk.id);
              const IconComponent = CATEGORY_ICONS[perk.category] || CATEGORY_ICONS.default;
              
              return (
                <motion.div
                  key={perk.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={cn(
                    "p-6 hover:shadow-lg transition-all border-2 h-full flex flex-col",
                    isEnrolled 
                      ? "border-gold bg-gold/5" 
                      : "border-gold/20 hover:border-gold/50"
                  )}>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-navy">{perk.name}</h3>
                        <p className="text-xs text-textMuted mt-1">{perk.category}</p>
                      </div>
                      {isEnrolled && (
                        <div className="ml-2">
                          <Star className="w-5 h-5 fill-gold text-gold" />
                        </div>
                      )}
                    </div>

                    {/* Perk Details */}
                    <div className="flex-1 mb-4">
                      <div className="bg-gold/10 rounded-lg p-3 mb-4">
                        <p className="text-sm font-semibold text-gold flex items-center gap-2">
                          <IconComponent className="w-4 h-4" />
                          {perk.perk}
                        </p>
                      </div>

                      {/* Location */}
                      {perk.address && (
                        <div className="flex items-start gap-2 text-sm text-textSecondary mb-3">
                          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>{perk.address}</span>
                        </div>
                      )}

                      {/* Hours */}
                      {perk.hours && (
                        <p className="text-xs text-textMuted mb-2">
                          <span className="font-semibold">Hours:</span> {perk.hours}
                        </p>
                      )}

                      {/* Specials */}
                      {perk.specials && (
                        <div className="text-xs text-navy bg-amber-50 p-2 rounded mb-3">
                          <span className="font-semibold">Special:</span> {perk.specials}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="space-y-2 pt-4 border-t border-gold/10">
                      <Button
                        onClick={() => toggleEnrollment(perk.id)}
                        className={cn(
                          "w-full transition-all",
                          isEnrolled
                            ? "bg-gold text-navy hover:bg-goldSoft"
                            : "bg-navy text-white hover:bg-navySoft"
                        )}
                      >
                        <Star className="w-4 h-4 mr-2" />
                        {isEnrolled ? "Enrolled" : "Enroll Now"}
                      </Button>
                      
                      {perk.website && (
                        <Button
                          variant="outline"
                          className="w-full border-gold/30 hover:border-gold/50 hover:bg-gold/5"
                          asChild
                        >
                          <a href={perk.website} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Visit Website
                          </a>
                        </Button>
                      )}
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