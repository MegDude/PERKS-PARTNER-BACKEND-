import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Globe, ArrowLeft, Heart, Loader2, Star, Clock } from 'lucide-react';
import PerkQRCode from '@/components/perks/PerkQRCode';

export default function PerkDetail() {
  const { perkId } = useParams();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  const { data: perk, isLoading } = useQuery({
    queryKey: ['perk_location', perkId],
    queryFn: () => base44.entities.PerkLocation.get(perkId),
    enabled: !!perkId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bgMain p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-textMuted" />
      </div>
    );
  }

  if (!perk) {
    return (
      <div className="min-h-screen bg-bgMain p-6 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-textMuted">Perk not found</p>
            <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fallbackImage = 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=800&h=500&fit=crop';

  return (
    <div className="min-h-screen bg-bgMain p-6">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <img src={perk.image_url || fallbackImage} alt={perk.name} className="w-full h-64 object-cover" />

          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl mb-2">{perk.name}</CardTitle>
                <p className="text-sm text-gold font-semibold">{perk.category}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSaved(!saved)}
              >
                <Heart className={`w-6 h-6 ${saved ? 'fill-red-500 text-red-500' : 'text-textMuted'}`} />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Perk Offer */}
            {perk.perk && (
              <div className="bg-gold/10 border-2 border-gold rounded-lg p-6">
                <p className="text-sm text-gold uppercase font-bold tracking-wide">Resident Exclusive</p>
                <p className="text-2xl font-bold text-navy mt-2">{perk.perk}</p>
              </div>
            )}

            {/* Specials / Deals */}
            {perk.specials && (
              <div className="flex items-start gap-3 p-4 bg-bgAlt rounded-xl">
                <Star className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-textMuted uppercase tracking-wide">Specials</p>
                  <p className="text-sm text-navy font-medium mt-0.5">{perk.specials}</p>
                </div>
              </div>
            )}

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="font-bold text-navy text-lg">Details</h3>

              {perk.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-navy mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-textMuted">Address</p>
                    <p className="text-navy font-medium">{perk.address}</p>
                  </div>
                </div>
              )}

              {perk.contact_phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-navy mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-textMuted">Phone</p>
                    <a href={`tel:${perk.contact_phone}`} className="text-navy font-medium hover:underline">{perk.contact_phone}</a>
                  </div>
                </div>
              )}

              {perk.website && (
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-navy mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-textMuted">Website</p>
                    <a href={perk.website} target="_blank" rel="noopener noreferrer" className="text-navy font-medium hover:underline">{perk.website}</a>
                  </div>
                </div>
              )}

              {perk.hours && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-navy mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-textMuted">Hours</p>
                    <p className="text-navy font-medium">{perk.hours}</p>
                  </div>
                </div>
              )}
            </div>

            {/* QR Code Generator */}
            <div className="pt-2">
              <PerkQRCode perk={perk} />
            </div>

            {/* CTA */}
            {perk.website && (
              <a href={perk.website} target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-navy hover:bg-navySoft text-white text-lg py-3 rounded-xl font-semibold transition-colors">
                Visit Website
              </a>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}