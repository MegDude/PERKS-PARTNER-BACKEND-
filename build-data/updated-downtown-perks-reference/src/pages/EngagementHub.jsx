import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Gift, Calendar, ClipboardList, MessageSquare, Users, Zap, Radio } from 'lucide-react';
import { useLanguage } from '@/components/context/LanguageContext';
import BoopEventsPanel from '@/components/BoopEventsPanel';
import BroadcastPanel from '@/components/engagement/BroadcastPanel';

const UserJourneyExamples = [
  {
    title: 'Resident Onboarding Journey',
    steps: [
      { action: 'Building Manager', message: 'Welcome to The Metropolitan! Here are your welcome perks.', timestamp: 'Day 1' },
      { action: 'Resident Response', message: 'Thanks! Which restaurants are nearby?', timestamp: 'Day 1' },
      { action: 'Building Manager', message: 'Check the Downtown Perks app for 20% off at Coffee Co and fine dining at Bella Notte!', timestamp: 'Day 1' },
      { action: 'Resident Action', message: 'Resident redeems first perk', timestamp: 'Day 3' }
    ]
  },
  {
    title: 'Event Engagement Journey',
    steps: [
      { action: 'Building Manager', message: 'Join us for Rooftop Yoga & Brunch this Saturday!', timestamp: 'Mon' },
      { action: 'Resident Response', message: 'Interested! How many spots available?', timestamp: 'Mon' },
      { action: 'Building Manager', message: '20 spots available. Reply YES to reserve your spot.', timestamp: 'Mon' },
      { action: 'Resident Action', message: 'Resident books 2 spots for event', timestamp: 'Tue' }
    ]
  },
  {
    title: 'Feedback Collection Journey',
    steps: [
      { action: 'Building Manager', message: 'Quick survey: How satisfied are you with building amenities?', timestamp: 'Week 1' },
      { action: 'Resident Response', message: 'Completes 2-minute survey', timestamp: 'Week 1' },
      { action: 'Manager Action', message: 'Receives feedback on gym, pool, and lobby', timestamp: 'Week 1' },
      { action: 'Building Improvement', message: 'Extended gym hours implemented', timestamp: 'Week 4' }
    ]
  }
];

const DemoSurveyQuestions = [
  {
    question: 'How satisfied are you with the building amenities?',
    type: 'rating',
    responses: { 'Very Satisfied': 34, 'Satisfied': 38, 'Neutral': 20, 'Dissatisfied': 8 }
  },
  {
    question: 'Which amenities would you like us to improve?',
    type: 'checkbox',
    responses: { 'Gym': 22, 'Pool': 18, 'Lobby': 12, 'Parking': 25, 'Outdoor Deck': 16 }
  },
  {
    question: 'How often do you use the fitness center?',
    type: 'radio',
    responses: { 'Daily': 28, '3-4x per week': 32, '1-2x per week': 24, 'Never': 16 }
  }
];

const CommunicationExamples = {
  announcements: [
    { title: 'Downtown Perks Program Update', content: 'Check out our latest partners and exclusive deals for residents!', icon: Bell, color: 'bg-blue-50', badge: 'Community Update' },
    { title: 'Building Maintenance Notice', content: 'Scheduled elevator maintenance on Saturday 9am-2pm. Alternative entrance via south lobby.', icon: MessageSquare, color: 'bg-amber-50', badge: 'Important' },
    { title: 'Summer Pool Opening', content: 'Our rooftop pool is now open! Bring your family and enjoy the season. New safety rules in effect.', icon: Calendar, color: 'bg-green-50', badge: 'Community Event' }
  ],
  perks: [
    { building: 'The Metropolitan', offer: '20% off at Coffee Co', partner: 'Coffee Co', type: 'Dining' },
    { building: 'Downtown Heights', offer: 'Free fitness class pass', partner: 'FitLife Gym', type: 'Wellness' },
    { building: 'The Metropolitan', offer: '$15 off dinner at Bella Notte', partner: 'Bella Notte', type: 'Fine Dining' },
    { building: 'Tower Residences', offer: 'Free weekend movie tickets', partner: 'Cinema Downtown', type: 'Entertainment' }
  ],
  events: [
    { title: 'Rooftop Yoga & Brunch', date: 'Saturday, April 20', time: '9:00 AM', attendees: 24, building: 'The Metropolitan' },
    { title: 'Summer Resident Mixer', date: 'Friday, May 3', time: '6:00 PM', attendees: 45, building: 'Downtown Heights' },
    { title: 'Wine Tasting Night', date: 'Saturday, April 27', time: '7:00 PM', attendees: 32, building: 'Tower Residences' }
  ],
  surveys: [
    { title: 'Amenities Feedback', building: 'The Metropolitan', responses: 87, total: 152, status: 'Active' },
    { title: 'Community Satisfaction', building: 'Downtown Heights', responses: 64, total: 98, status: 'Closed' },
    { title: 'Maintenance Priorities', building: 'Tower Residences', responses: 45, total: 120, status: 'Active' }
  ]
};

export default function EngagementHub() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [boopEventsOpen, setBoopEventsOpen] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      // User not logged in
    }
  };

  const { data: broadcasts = [] } = useQuery({
    queryKey: ['broadcasts'],
    queryFn: () => base44.entities.Broadcast.list().catch(() => [])
  });

  const { data: surveys = [] } = useQuery({
    queryKey: ['surveys'],
    queryFn: () => base44.entities.Survey.list().catch(() => [])
  });

  const { data: perks = [] } = useQuery({
    queryKey: ['perks'],
    queryFn: () => base44.entities.PerkLocation.list().catch(() => [])
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Engagement Hub</h1>
          <p className="text-slate-600">Manage resident communications, announcements, events, and perks</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Recent Announcements</p>
                  <p className="text-3xl font-bold text-slate-900">{broadcasts.length || 0}</p>
                </div>
                <Bell className="w-10 h-10 text-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Active Surveys</p>
                  <p className="text-3xl font-bold text-slate-900">{surveys.filter(s => s.status === 'active').length || 0}</p>
                </div>
                <ClipboardList className="w-10 h-10 text-secondary/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Partner Perks</p>
                  <p className="text-3xl font-bold text-slate-900">{perks.length || CommunicationExamples.perks.length}</p>
                </div>
                <Gift className="w-10 h-10 text-amber-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Upcoming Events</p>
                  <p className="text-3xl font-bold text-slate-900">{CommunicationExamples.events.length}</p>
                </div>
                <Calendar className="w-10 h-10 text-green-200" />
              </div>
            </CardContent>
          </Card>

          {/* Boop Events Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setBoopEventsOpen(true)}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Live Boop Events</p>
                  <p className="text-3xl font-bold text-slate-900">4</p>
                </div>
                <div className="relative">
                  <Zap className="w-10 h-10 text-secondary animate-pulse" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2 cursor-pointer text-secondary hover:underline">→ Open event map</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="announcements" className="w-full">
          <TabsList className="mb-6">
           <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
           <TabsTrigger value="announcements">Announcements</TabsTrigger>
           <TabsTrigger value="perks">Perks & Offers</TabsTrigger>
           <TabsTrigger value="events">Events</TabsTrigger>
           <TabsTrigger value="boop">Boop Events (Live)</TabsTrigger>
           <TabsTrigger value="journeys">User Journeys</TabsTrigger>
           <TabsTrigger value="surveys">Surveys</TabsTrigger>
          </TabsList>

          {/* Broadcast Tab */}
          <TabsContent value="broadcast" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Broadcast Messaging</h2>
              <p className="text-sm text-slate-500">Send targeted messages to enrolled residents in your building</p>
            </div>
            <BroadcastPanel />
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Recent Announcements</h2>
              <p className="text-sm text-slate-500">Messages sent to residents by building managers</p>
            </div>
            <div className="space-y-4">
              {CommunicationExamples.announcements.map((announcement, idx) => {
                const Icon = announcement.icon;
                return (
                  <Card key={idx} className={announcement.color}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-white rounded-lg">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900">{announcement.title}</h3>
                            <Badge variant="outline">{announcement.badge}</Badge>
                          </div>
                          <p className="text-slate-600 text-sm">{announcement.content}</p>
                          <p className="text-xs text-slate-500 mt-2">The Metropolitan Building</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Perks Tab */}
          <TabsContent value="perks" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Resident Perks & Offers</h2>
              <p className="text-sm text-slate-500">Exclusive discounts and benefits from downtown partners</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CommunicationExamples.perks.map((perk, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900">{perk.partner}</h3>
                          <p className="text-sm text-slate-500">{perk.building}</p>
                        </div>
                        <Badge className="bg-secondary text-secondary-foreground">{perk.type}</Badge>
                      </div>
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                        <p className="font-medium text-slate-900">{perk.offer}</p>
                      </div>
                      <p className="text-xs text-slate-500">Exclusive resident benefit</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Boop Events Tab */}
          <TabsContent value="boop" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Boop Events - Live Map Integration</h2>
              <p className="text-sm text-slate-500">Real-time event booking directly from the map interface</p>
            </div>
            <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/30">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-secondary/20 rounded-lg">
                      <Zap className="w-6 h-6 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1">How Boop Events Works</h3>
                      <p className="text-sm text-slate-600 mb-3">Residents click on buildings or venues on the map to see live, real-time events happening nearby. One-tap booking—no external redirects.</p>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li>✓ See all events by building proximity</li>
                        <li>✓ One-tap booking directly in the map drawer</li>
                        <li>✓ Real-time availability and spot counts</li>
                        <li>✓ Exclusive resident-only pricing</li>
                      </ul>
                    </div>
                  </div>
                  <button 
                    onClick={() => setBoopEventsOpen(true)}
                    className="w-full mt-4 px-4 py-3 bg-secondary text-white rounded-lg font-medium hover:bg-secondary/90 transition-colors"
                  >
                    Open Event Map Drawer →
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Community Events</h2>
              <p className="text-sm text-slate-500">Upcoming activities and gatherings for residents</p>
            </div>
            <div className="space-y-4">
              {CommunicationExamples.events.map((event, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900">{event.title}</h3>
                          <p className="text-sm text-slate-500">{event.building}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Upcoming</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-slate-500">Date & Time</p>
                          <p className="font-medium text-slate-900">{event.date}</p>
                          <p className="text-slate-600">{event.time}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Registrations</p>
                          <p className="font-medium text-slate-900">{event.attendees} residents</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* User Journeys Tab */}
          <TabsContent value="journeys" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Resident Communication Flows</h2>
              <p className="text-sm text-slate-500">Example journeys showing how managers and residents interact</p>
            </div>
            <div className="space-y-4">
              {UserJourneyExamples.map((journey, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-lg">{journey.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {journey.steps.map((step, stepIdx) => (
                        <div key={stepIdx} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold ${
                              step.action === 'Resident Response' || step.action === 'Resident Action' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {stepIdx + 1}
                            </div>
                            {stepIdx < journey.steps.length - 1 && (
                              <div className="w-0.5 h-8 bg-slate-200 my-2" />
                            )}
                          </div>
                          <div className="flex-1 pt-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-slate-900">{step.action}</p>
                              <Badge variant="outline" className="text-xs">{step.timestamp}</Badge>
                            </div>
                            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">{step.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Surveys Tab */}
          <TabsContent value="surveys" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Resident Surveys</h2>
              <p className="text-sm text-slate-500">Gather feedback and insights from your community</p>
            </div>
            <div className="space-y-4">
              {/* Demo Survey */}
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>Amenities Feedback Survey (Demo)</CardTitle>
                      <p className="text-sm text-slate-500 mt-1">Active survey - 87 responses so far</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {DemoSurveyQuestions.map((q, qIdx) => (
                    <div key={qIdx} className="space-y-3">
                      <p className="font-medium text-slate-900">{q.question}</p>
                      <div className="space-y-2">
                        {Object.entries(q.responses).map(([answer, count]) => {
                          const total = Object.values(q.responses).reduce((a, b) => a + b, 0);
                          const percentage = Math.round((count / total) * 100);
                          return (
                            <div key={answer}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-600">{answer}</span>
                                <span className="font-medium text-slate-900">{count} ({percentage}%)</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Past Surveys */}
              {CommunicationExamples.surveys.map((survey, idx) => {
                const responseRate = Math.round((survey.responses / survey.total) * 100);
                return (
                  <Card key={idx}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900">{survey.title}</h3>
                            <p className="text-sm text-slate-500">{survey.building}</p>
                          </div>
                          <Badge className={survey.status === 'Active' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'}>
                            {survey.status}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Response Rate</span>
                            <span className="font-medium text-slate-900">{responseRate}% ({survey.responses}/{survey.total})</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${responseRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Boop Events Panel */}
        <BoopEventsPanel isOpen={boopEventsOpen} onClose={() => setBoopEventsOpen(false)} />

        {/* Footer Info */}
        <div className="mt-12 bg-primary/5 border border-primary/20 rounded-lg p-6">
          <div className="flex gap-4">
            <Users className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Engagement Best Practices</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Send regular announcements to keep residents informed</li>
                <li>• Feature partner perks and special offers weekly</li>
                <li>• Host monthly community events to build connection</li>
                <li>• Conduct quarterly surveys to gather resident feedback</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}