import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Phone, Home, IndianRupee, Calendar, Loader2 } from 'lucide-react';

export default function TenantModal({ 
  open, 
  onClose, 
  tenant, 
  flatNumber,
  flatId,
  onSave, 
  isLoading 
}) {
  const [formData, setFormData] = useState({
    name: '',
    flat_id: '',
    flat_number: '',
    mobile_number: '',
    preferred_language: 'en',
    yearly_rent: '',
    rent_interval_months: 6,
    rent_per_interval: '',
    next_payment_date: '',
    last_payment_date: '',
    payment_status: 'unpaid'
  });

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || '',
        flat_id: tenant.flat_id || '',
        flat_number: tenant.flat_number || flatNumber || '',
        mobile_number: tenant.mobile_number || '',
        preferred_language: tenant.preferred_language || 'en',
        yearly_rent: tenant.yearly_rent || '',
        rent_interval_months: tenant.rent_interval_months || 6,
        rent_per_interval: tenant.rent_per_interval || '',
        next_payment_date: tenant.next_payment_date || '',
        last_payment_date: tenant.last_payment_date || '',
        payment_status: tenant.payment_status || 'unpaid'
      });
    } else if (flatId) {
      setFormData(prev => ({
        ...prev,
        flat_id: flatId,
        flat_number: flatNumber || ''
      }));
    }
  }, [tenant, flatNumber, flatId]);

  const handleYearlyRentChange = (value) => {
    const yearly = parseFloat(value) || 0;
    const cycleMonths = parseInt(formData.rent_interval_months) || 6;
    const perInterval = yearly > 0 ? (yearly / 12) * cycleMonths : 0;
    
    setFormData(prev => ({
      ...prev,
      yearly_rent: value,
      rent_per_interval: perInterval.toFixed(2)
    }));
  };

  const handleIntervalMonthsChange = (value) => {
    const cycleMonths = parseInt(value) || 6;
    const yearly = parseFloat(formData.yearly_rent) || 0;
    const perInterval = yearly > 0 ? (yearly / 12) * cycleMonths : 0;
    
    setFormData(prev => ({
      ...prev,
      rent_interval_months: value,
      rent_per_interval: perInterval.toFixed(2)
    }));
  };

  const handleLastPaymentDateChange = (value) => {
    const cycleMonths = parseInt(formData.rent_interval_months) || 6;
    let nextDate = '';
    
    if (value) {
      const lastDate = new Date(value);
      lastDate.setMonth(lastDate.getMonth() + cycleMonths);
      nextDate = lastDate.toISOString().split('T')[0];
    }
    
    setFormData(prev => ({
      ...prev,
      last_payment_date: value,
      next_payment_date: nextDate
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      yearly_rent: parseFloat(formData.yearly_rent) || 0,
      rent_interval_months: parseInt(formData.rent_interval_months) || 6,
      rent_per_interval: parseFloat(formData.rent_per_interval) || 0
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="w-5 h-5 text-slate-600" />
            {tenant ? 'Edit Tenant' : 'Add New Tenant'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              Full Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter tenant name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="flat_number">Flat Number</Label>
            <Input
              id="flat_number"
              value={formData.flat_number}
              disabled
              className="bg-slate-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile" className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />
              Mobile Number
            </Label>
            <Input
              id="mobile"
              value={formData.mobile_number}
              onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
              placeholder="+91 9876543210"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="yearly_rent" className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-slate-400" />
              Yearly Rent
            </Label>
            <Input
              id="yearly_rent"
              type="number"
              value={formData.yearly_rent}
              onChange={(e) => handleYearlyRentChange(e.target.value)}
              placeholder="180000"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interval_months">Payment Interval</Label>
              <Select
                value={String(formData.rent_interval_months)}
                onValueChange={handleIntervalMonthsChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                    <SelectItem key={m} value={String(m)}>{m} month{m > 1 ? 's' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rent_per_interval">Rent Per Interval</Label>
              <Input
                id="rent_per_interval"
                type="number"
                value={formData.rent_per_interval}
                onChange={(e) => setFormData({ ...formData, rent_per_interval: e.target.value })}
                placeholder="Auto-calculated"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="last_payment" className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                Last Payment Date
              </Label>
              <Input
                id="last_payment"
                type="date"
                value={formData.last_payment_date}
                onChange={(e) => handleLastPaymentDateChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="next_payment">Next Payment Date</Label>
              <Input
                id="next_payment"
                type="date"
                value={formData.next_payment_date}
                onChange={(e) => setFormData({ ...formData, next_payment_date: e.target.value })}
              />
              <p className="text-xs text-slate-500">Auto-calculated or manual</p>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-slate-800 hover:bg-slate-900">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {tenant ? 'Update' : 'Add Tenant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}