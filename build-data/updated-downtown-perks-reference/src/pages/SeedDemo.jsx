import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SeedDemo() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSeedData = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await base44.functions.invoke('seedDemoData', {});
      setResult(response.data);
    } catch (err) {
      setError(err.message || 'Failed to seed demo data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bgMain p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="border-gold/20">
          <CardHeader>
            <CardTitle className="text-2xl">Seed Demo Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-900 text-sm">
                This will populate your application with realistic demo data including residents, events, perks, announcements, surveys, amenities, maintenance tickets, and campaigns.
              </p>
            </div>

            <Button
              onClick={handleSeedData}
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Seeding Data...
                </>
              ) : (
                'Seed Demo Data'
              )}
            </Button>

            {result && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-900 mb-2">Success!</p>
                    <p className="text-green-800 text-sm mb-3">{result.message}</p>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>• Building: {result.building}</p>
                      <p>• Residents: {result.stats.tenants}</p>
                      <p>• Events: {result.stats.events}</p>
                      <p>• Partners: {result.stats.partners}</p>
                      <p>• Amenities: {result.stats.amenities}</p>
                      <p>• Campaigns: {result.stats.campaigns}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-900 mb-1">Error</p>
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}