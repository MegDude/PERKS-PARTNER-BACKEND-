import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Clock } from 'lucide-react';
import { format, addDays } from 'date-fns';

export default function ReservationModal({ amenity, tenant, onClose, onReservationCreated }) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState(amenity?.hours_start || '09:00');
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    generateSlots();
  }, [selectedDate]);

  const generateSlots = async () => {
    try {
      const [startHour, startMin] = (amenity?.hours_start || '09:00').split(':').map(Number);
      const [endHour, endMin] = (amenity?.hours_end || '17:00').split(':').map(Number);
      const duration = amenity?.slot_duration || 60;

      const slots = [];
      let current = new Date();
      current.setHours(startHour, startMin, 0);

      const end = new Date();
      end.setHours(endHour, endMin, 0);

      while (current < end) {
        const timeStr = format(current, 'HH:mm');
        slots.push(timeStr);
        current.setMinutes(current.getMinutes() + duration);
      }

      const reservations = await base44.entities.AmenityReservation.filter({
        amenity_id: amenity.id,
        reservation_date: selectedDate,
        status: 'confirmed'
      });

      const bookedSlots = reservations.map(r => r.start_time);
      const available = slots.filter(s => !bookedSlots.includes(s));
      setAvailableSlots(available);
      if (available.length > 0) setSelectedTime(available[0]);
    } catch (error) {
      console.error('Error generating slots:', error);
    }
  };

  const calculateEndTime = () => {
    const [hours, mins] = selectedTime.split(':').map(Number);
    const duration = amenity?.slot_duration || 60;
    const endDate = new Date();
    endDate.setHours(hours, mins + duration);
    return format(endDate, 'HH:mm');
  };

  const handleReserve = async () => {
    if (!selectedDate || !selectedTime || !tenant) return;

    setLoading(true);
    try {
      await base44.entities.AmenityReservation.create({
        amenity_id: amenity.id,
        tenant_id: tenant.id,
        reservation_date: selectedDate,
        start_time: selectedTime,
        end_time: calculateEndTime(),
        status: 'confirmed'
      });
      onReservationCreated();
    } catch (error) {
      console.error('Error creating reservation:', error);
    } finally {
      setLoading(false);
    }
  };

  const minDate = format(new Date(), 'yyyy-MM-dd');
  const maxDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reserve {amenity?.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-navy mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Select Date
            </label>
            <input 
              type="date"
              min={minDate}
              max={maxDate}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>

          {/* Time Selection */}
          <div>
            <label className="block text-sm font-medium text-navy mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Select Time Slot
            </label>
            {availableSlots.length === 0 ? (
              <p className="text-sm text-red-600">No available slots for this date</p>
            ) : (
              <select 
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
              >
                {availableSlots.map(slot => (
                  <option key={slot} value={slot}>
                    {slot} - {slot.split(':')[0]}:{String((parseInt(slot.split(':')[1]) + (amenity?.slot_duration || 60)) % 60).padStart(2, '0')}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Reservation:</strong> {format(new Date(selectedDate), 'MMM dd, yyyy')} from {selectedTime} to {calculateEndTime()}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleReserve}
              disabled={loading || availableSlots.length === 0}
              className="flex-1 bg-navy hover:bg-navySoft text-white"
            >
              {loading ? 'Reserving...' : 'Confirm Reservation'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}