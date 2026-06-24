import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Loader2, Building2, Mail, Phone, MapPin, User } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function PartnerProfile({ userPartner }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    business_name: userPartner?.business_name || '',
    contact_email: userPartner?.contact_email || '',
    contact_phone: userPartner?.contact_phone || '',
    contact_person: userPartner?.contact_person || '',
    address: userPartner?.address || '',
    category: userPartner?.category || '',
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('updatePartnerProfile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner_context'] });
      toast.success('Profile updated successfully!');
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      business_name: formData.business_name,
      contact_person: formData.contact_person,
      contact_phone: formData.contact_phone,
      address: formData.address,
      category: formData.category,
    });
  };

  const fields = [
    { key: 'business_name', label: 'Business Name', icon: Building2, placeholder: 'Your business name' },
    { key: 'contact_person', label: 'Contact Person', icon: User, placeholder: 'Primary contact name' },
    { key: 'contact_email', label: 'Contact Email', icon: Mail, placeholder: 'contact@business.com' },
    { key: 'contact_phone', label: 'Contact Phone', icon: Phone, placeholder: '(512) 555-0100' },
    { key: 'address', label: 'Business Address', icon: MapPin, placeholder: '123 Main St, Austin, TX' },
    { key: 'category', label: 'Category', icon: Building2, placeholder: 'Bar/Nightlife, Restaurant, etc.' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-white border-[var(--border-subtle)]">
        <CardHeader>
          <CardTitle className="text-navy">Partner Profile</CardTitle>
          <CardDescription>Update your business contact information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map(({ key, label, icon: Icon, placeholder }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-xs font-semibold text-navy uppercase flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-textMuted" />
                    {label}
                  </label>
                  <Input
                    value={formData[key] || ''}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>

            {userPartner?.joined_date && (
              <div className="flex items-center gap-2 text-xs text-textMuted pt-2">
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg font-medium">
                  Active Partner
                </span>
                Joined {new Date(userPartner.joined_date).toLocaleDateString()}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-gold hover:bg-gold/90 text-navy"
              >
                {updateMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><Save className="w-4 h-4 mr-1" /> Save Changes</>
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}