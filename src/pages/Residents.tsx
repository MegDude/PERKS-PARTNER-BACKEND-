import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { H1 } from '@/components/ui/Typography';
import { Users, Search, Mail, Phone, Home, Loader2, Star } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function Residents() {
  const { buildingId } = useOutletContext<any>() || { buildingId: null };
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      // User not authenticated
    }
  };

  const { data: residents = [], isLoading } = useQuery({
    queryKey: ['residents', buildingId],
    queryFn: async () => {
        try {
            return await base44.entities.Tenant.list();
        } catch {
            return [];
        }
    },
  });

  const { data: flats = [] } = useQuery({
    queryKey: ['flats', buildingId],
    queryFn: async () => {
        try {
            return await base44.entities.Flat.list(); // filter manually 
        } catch {
            return [];
        }
    },
  });

  const enrichedResidents = (residents as any[]).map((resident: any) => {
    const flat = (flats as any[]).find((f: any) => f.id === resident.flat_id);
    return { ...resident, flat };
  });

  const filteredResidents = enrichedResidents.filter(resident => {
    if (buildingId && resident.flat?.building_id !== buildingId) return false;

    const matchesSearch = 
      resident.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.flat?.flat_number?.includes(searchTerm);
    
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 p-6 bg-white shadow-[0_18px_50px_rgba(17,24,43,0.05)] border border-[#EFEFEF] rounded-none">
          <h3 className="text-xl font-bold text-[#11182B] mb-2">Resident CRM</h3>
          <p className="text-slate-500 font-medium text-sm leading-relaxed">
            Review resident records, unit assignments, membership status, and Downtown Perks access from one building-scoped workspace.
          </p>
        </div>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-none bg-slate-100 border border-[#EFEFEF]">
              <Users className="w-6 h-6 text-[#11182B] " />
            </div>
            <div>
              <H1 className="text-3xl font-bold text-[#11182B] ">Residents</H1>
              <p className="text-slate-500 font-medium">{filteredResidents.length} residents</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by name, email, or unit number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-[#EFEFEF] font-medium"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#11182B] " />
          </div>
        ) : filteredResidents.length === 0 ? (
          <Card className="p-12 text-center  ">
            <div className="p-4 rounded-none bg-slate-50 border border-slate-100 w-fit mx-auto mb-4">
              <Users className="w-8 h-8 text-[#11182B] " />
            </div>
            <h3 className="text-lg font-bold text-[#11182B] ">No residents match this view</h3>
            <p className="text-slate-500 font-medium mt-1">Search another name, email, or unit number to continue.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResidents.map((resident, idx) => (
              <motion.div key={resident.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card className="p-6 hover: transition-all    ">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-none bg-white flex items-center justify-center border border-[#EFEFEF]">
                        <span className="font-bold text-[#11182B] text-lg">
                          {resident.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-[#11182B] ">{resident.name}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          Unit {resident.flat?.flat_number}
                        </p>
                      </div>
                    </div>
                    {resident.perks_enrolled && (
                      <Badge className="bg-[#11182B]/10 text-[#11182B] border-[#11182B]/30 text-[10px] uppercase font-bold tracking-widest">
                        <Star className="w-3 h-3 mr-1" /> Perks
                      </Badge>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
