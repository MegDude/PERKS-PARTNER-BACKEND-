import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, Star, Bell, Mail, Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/context/LanguageContext';

const steps = [
  { id: 'profile', title: 'Complete Your Profile', icon: Building2 },
  { id: 'perks', title: 'Join Downtown Perks', icon: Star },
  { id: 'preferences', title: 'Communication Preferences', icon: Bell }
];

export default function WelcomeFlow() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    preferredLanguage: 'en',
    perksEnrolled: true,
    perksTier: 'standard',
    emailNotifications: true,
    smsNotifications: false
  });

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await completeOnboarding();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      await base44.auth.updateMe({
        ...formData,
        onboarding_completed: true
      });
      navigate(`/buildings/${user.id}`);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <ProfileStep formData={formData} setFormData={setFormData} />;
      case 1:
        return <PerksStep formData={formData} setFormData={setFormData} />;
      case 2:
        return <PreferencesStep formData={formData} setFormData={setFormData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bgMain flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = idx < currentStep;
              const isCurrent = idx === currentStep;

              return (
                <motion.div
                  key={step.id}
                  className="flex flex-col items-center gap-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <motion.div
                    className={`w-12 h-12 rounded-none flex items-center justify-center transition-all ${
                      isCompleted || isCurrent
                        ? 'bg-[#11182B] text-white'
                        : 'bg-bgAlt text-textMuted'
                    }`}
                    animate={isCurrent ? { scale: 1.1 } : { scale: 1 }}
                  >
                    <Icon className="w-6 h-6" />
                  </motion.div>
                  <p className={`text-xs font-medium text-center ${
                    isCurrent ? 'text-[#11182B]' : 'text-textMuted'
                  }`}>
                    {step.title}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1 bg-bgAlt rounded-none overflow-hidden">
            <motion.div
              className="h-full bg-gold"
              initial={{ width: '0%' }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className=" ">
              <CardHeader>
                <CardTitle className="text-2xl text-[#11182B]">
                  {steps[currentStep].title}
                </CardTitle>
                <CardDescription>
                  Step {currentStep + 1} of {steps.length}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderStepContent()}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0 || loading}
            className="flex-1"
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={loading}
            className="flex-1 bg-navy hover:bg-[#11182B] text-white font-semibold"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProfileStep({ formData, setFormData }: any) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-textSecondary">
        Let's get your communication preferences set up.
      </p>
      <div>
        <label className="text-sm font-medium text-[#11182B] block mb-2">
          Preferred Language
        </label>
        <select
          value={formData.preferredLanguage}
          onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
          className="w-full px-4 py-2 rounded-none border border-navy/30 bg-white text-[#11182B] focus:border-navy focus:ring-1 focus:ring-gold/20"
        >
          <option value="en">English</option>
          <option value="ar">العربية (Arabic)</option>
        </select>
      </div>
    </div>
  );
}

function PerksStep({ formData, setFormData }: any) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-textSecondary">
        Join the Downtown Perks program and get exclusive benefits from local businesses.
      </p>

      <div className="bg-navy/10 border border-navy/30 rounded-none p-4">
        <h4 className="font-semibold text-[#11182B] mb-3">Program Benefits</h4>
        <ul className="space-y-2 text-sm text-textSecondary">
          <li>✓ Exclusive discounts at 50+ local restaurants and shops</li>
          <li>✓ Early access to community events</li>
          <li>✓ Special member-only promotions</li>
          <li>✓ Loyalty rewards</li>
        </ul>
      </div>

      <div className="flex items-center gap-3 p-4 border border-navy/20 rounded-none cursor-pointer"
        onClick={() => setFormData({ ...formData, perksEnrolled: !formData.perksEnrolled })}>
        <Checkbox
          checked={formData.perksEnrolled}
          onCheckedChange={(checked) => setFormData({ ...formData, perksEnrolled: checked })}
        />
        <label className="text-sm font-medium text-[#11182B] cursor-pointer flex-1">
          Yes, enroll me in Downtown Perks
        </label>
      </div>

      {formData.perksEnrolled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <label className="text-sm font-medium text-[#11182B] block mb-2">
            Membership Tier
          </label>
          <select
            value={formData.perksTier}
            onChange={(e) => setFormData({ ...formData, perksTier: e.target.value })}
            className="w-full px-4 py-2 rounded-none border border-navy/30 bg-white text-[#11182B] focus:border-navy focus:ring-1 focus:ring-gold/20"
          >
            <option value="standard">Standard - Free access to all perks</option>
            <option value="premium">Premium - Extra 10% off + priority events</option>
            <option value="vip">VIP - 15% off + exclusive access</option>
          </select>
        </motion.div>
      )}
    </div>
  );
}

function PreferencesStep({ formData, setFormData }: any) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-textSecondary">
        Choose how you'd like to stay updated about community news and events.
      </p>

      <div className="space-y-3">
        <div className="flex items-center gap-3 p-4 border border-navy/20 rounded-none cursor-pointer"
          onClick={() => setFormData({ ...formData, emailNotifications: !formData.emailNotifications })}>
          <Checkbox
            checked={formData.emailNotifications}
            onCheckedChange={(checked) => setFormData({ ...formData, emailNotifications: checked })}
          />
          <div className="flex-1">
            <label className="text-sm font-medium text-[#11182B] cursor-pointer block">
              <Mail className="w-4 h-4 inline mr-2" />
              Email Notifications
            </label>
            <p className="text-xs text-textMuted">Community updates, events, and perks</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 border border-navy/20 rounded-none cursor-pointer"
          onClick={() => setFormData({ ...formData, smsNotifications: !formData.smsNotifications })}>
          <Checkbox
            checked={formData.smsNotifications}
            onCheckedChange={(checked) => setFormData({ ...formData, smsNotifications: checked })}
          />
          <div className="flex-1">
            <label className="text-sm font-medium text-[#11182B] cursor-pointer block">
              SMS Notifications
            </label>
            <p className="text-xs text-textMuted">Urgent announcements and time-sensitive offers</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-textMuted bg-bgAlt p-3 rounded-none">
        You can update these preferences anytime in your account settings.
      </p>
    </div>
  );
}
