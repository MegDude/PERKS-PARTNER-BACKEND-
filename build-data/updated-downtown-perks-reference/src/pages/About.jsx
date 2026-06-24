import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Users, TrendingUp, MapPin, Building2, CheckCircle2 } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-primary mb-3">Downtown Perks</h1>
          <p className="text-xl text-slate-600">A resident engagement and community building program for Austin's premium downtown properties</p>
        </motion.div>

        {/* What is Downtown Perks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Star className="w-6 h-6 text-secondary" />
                What is Downtown Perks?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-700 space-y-4">
              <p>
                Downtown Perks is an exclusive benefits program designed to enhance resident satisfaction and engagement across downtown Austin residential properties. We partner with premium local venues to offer exclusive discounts, events, and experiences available only to participating building residents.
              </p>
              <p>
                Our platform provides property managers with comprehensive tools to manage resident engagement, track program participation, conduct surveys, and communicate directly with their community.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* For Property Managers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <Building2 className="w-6 h-6 text-secondary" />
                For Property Managers
              </CardTitle>
            </CardHeader>
            <CardContent className="text-slate-700">
              <p className="mb-6">
                This management hub empowers you to:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-secondary mt-1 flex-shrink-0" />
                  <div>
                    <strong>Monitor Engagement</strong>
                    <p className="text-sm text-slate-600">Track perks enrollment rates, survey responses, and resident participation metrics across your properties</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-secondary mt-1 flex-shrink-0" />
                  <div>
                    <strong>Communicate Directly</strong>
                    <p className="text-sm text-slate-600">Send targeted broadcasts, announcements, and event invitations to your resident community</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-secondary mt-1 flex-shrink-0" />
                  <div>
                    <strong>Gather Feedback</strong>
                    <p className="text-sm text-slate-600">Create and manage surveys to understand resident preferences and satisfaction</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-secondary mt-1 flex-shrink-0" />
                  <div>
                    <strong>Manage Tenants</strong>
                    <p className="text-sm text-slate-600">Maintain resident records, track lease information, and manage rent collection</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-secondary mt-1 flex-shrink-0" />
                  <div>
                    <strong>Host Events</strong>
                    <p className="text-sm text-slate-600">Organize community events and coordinate with perks venues for exclusive experiences</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Key Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-secondary" />
                Boost Engagement
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Increase resident satisfaction and retention through exclusive benefits and community events
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-secondary" />
                Build Community
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Foster meaningful connections among residents and strengthen neighborhood bonds
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-secondary" />
                Premium Partnerships
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Access to 100+ curated downtown venues offering exclusive resident discounts
            </CardContent>
          </Card>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-700 space-y-4">
              <ol className="space-y-3 list-none">
                <li className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-primary text-white rounded-full text-sm font-bold flex-shrink-0">1</span>
                  <div>
                    <strong>Resident Enrollment</strong>
                    <p className="text-sm text-slate-600">Residents join the perks program and select their membership tier</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-primary text-white rounded-full text-sm font-bold flex-shrink-0">2</span>
                  <div>
                    <strong>Access Benefits</strong>
                    <p className="text-sm text-slate-600">Residents enjoy exclusive discounts, events, and experiences at partner venues</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-primary text-white rounded-full text-sm font-bold flex-shrink-0">3</span>
                  <div>
                    <strong>Property Manager Oversight</strong>
                    <p className="text-sm text-slate-600">You monitor participation, gather feedback, and optimize resident experience</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-primary text-white rounded-full text-sm font-bold flex-shrink-0">4</span>
                  <div>
                    <strong>Build Loyalty</strong>
                    <p className="text-sm text-slate-600">Satisfied residents stay longer, refer others, and become community ambassadors</p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}