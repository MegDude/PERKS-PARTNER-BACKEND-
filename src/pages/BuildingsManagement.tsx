import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Surveys from './Surveys';
import BuildingEngagement from './BuildingEngagement';

// Fetch properties from backend API instead of base44
const fetchProperties = async () => {
  const res = await fetch('/api/properties');
  if (!res.ok) throw new Error('Failed to fetch properties');
  return res.json();
};

export default function BuildingsManagement() {
  const navigate = useNavigate();
  const { tab = 'apartments' } = useParams();
  const [selectedBuildingId, setSelectedBuildingId] = useState<any>(null);
  const isAdmin = true; // Assume admin for dashboard currently

  const { data: buildings = [], isLoading } = useQuery({
    queryKey: ['buildings-api'],
    queryFn: fetchProperties
  });

  // Set first building as default
  useEffect(() => {
    if (buildings.length > 0 && !selectedBuildingId) {
      const theShore = buildings.find((b: any) => b.name === 'The Shore') || buildings[0];
      setSelectedBuildingId(theShore.id);
    }
  }, [buildings, selectedBuildingId]);

  const selectedBuilding = buildings.find((b: any) => b.id === selectedBuildingId);

  return (
    <div className="min-h-screen bg-bgMain">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#11182B]">Buildings</h1>
              <p className="text-sm text-textMuted mt-1">Manage all building operations</p>
            </div>
          </div>

          {/* Building Selector */}
          {isLoading ? (
             <div className="flex items-center gap-2 text-textMuted text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading properties...
             </div>
          ) : buildings.length > 0 && (
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-textSecondary">Select Building:</label>
              <select
                value={selectedBuildingId || ''}
                onChange={(e) => setSelectedBuildingId(e.target.value)}
                className="px-4 py-2 border border-[var(--border-subtle)] rounded-none bg-white text-sm font-medium text-[#11182B]"
              >
                {buildings.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <span className="text-sm text-textMuted">
                {selectedBuilding?.address && `• ${selectedBuilding.address}`}
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(newTab) => navigate(`/admin/buildings/${newTab}`)} className="space-y-6">
          <TabsList className="border-b border-[var(--border-subtle)] rounded-none p-0 h-auto bg-transparent">
            <TabsTrigger 
              value="apartments"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-navy data-[state=active]:bg-transparent px-4 py-3"
            >
              Apartments
            </TabsTrigger>
            <TabsTrigger 
              value="tenants"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-navy data-[state=active]:bg-transparent px-4 py-3"
            >
              Tenants
            </TabsTrigger>
            <TabsTrigger 
              value="surveys"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-navy data-[state=active]:bg-transparent px-4 py-3"
            >
              Surveys
            </TabsTrigger>
            <TabsTrigger 
              value="engagement"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-navy data-[state=active]:bg-transparent px-4 py-3"
            >
              Engagement
            </TabsTrigger>
            <TabsTrigger 
              value="amenities"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-navy data-[state=active]:bg-transparent px-4 py-3"
            >
              Amenities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="apartments">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Building Apartments</CardTitle>
                  {isAdmin && (
                    <Button size="sm" className="bg-navy hover:bg-navySoft text-white ">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Apartment
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-textMuted">Apartment management coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tenants">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Building Tenants</CardTitle>
                  {isAdmin && (
                    <Button size="sm" className="bg-navy hover:bg-navySoft text-white ">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Tenant
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedBuilding && (
                  <p className="text-textMuted mb-4">Total tenants at this property: {selectedBuilding.tenants}</p>
                )}
                <p className="text-textMuted">Tenant management - access from Dashboard for now</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="surveys">
             {/* If using Surveys as a component here, ensure Surveys does not rely heavily on Context when used like this, or that it wraps properly */}
            <p className="text-textMuted">Ensure Surveys component handles params correctly.</p>
          </TabsContent>

          <TabsContent value="engagement">
             <p className="text-textMuted">Ensure BuildingEngagement handles component usage correctly.</p>
          </TabsContent>

          <TabsContent value="amenities">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Building Amenities</CardTitle>
                  {isAdmin && (
                    <Button size="sm" className="bg-navy hover:bg-navySoft text-white ">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Amenity
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-textMuted">Amenity management coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
