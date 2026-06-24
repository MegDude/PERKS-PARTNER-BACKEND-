import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, AlertCircle, Wrench, Users, Calendar } from 'lucide-react';
import moment from 'moment';

const TYPE_ICONS = {
  urgent: AlertCircle,
  maintenance: Wrench,
  community_news: Users,
  event: Calendar,
  reminder: AlertCircle
};

const TYPE_COLORS = {
  urgent: 'bg-red-100 text-red-800 border-red-200',
  maintenance: 'bg-orange-100 text-orange-800 border-orange-200',
  community_news: 'bg-blue-100 text-blue-800 border-blue-200',
  event: 'bg-purple-100 text-purple-800 border-purple-200',
  reminder: 'bg-yellow-100 text-yellow-800 border-yellow-200'
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

export default function AnnouncementCard({ announcement, isManager = false, onEdit, onDelete }) {
  const TypeIcon = TYPE_ICONS[announcement.type] || AlertCircle;

  return (
    <Card className={`border-l-4 ${
      announcement.priority === 'urgent' ? 'border-l-red-600' :
      announcement.priority === 'high' ? 'border-l-orange-500' :
      'border-l-blue-400'
    } hover:shadow-lg transition-shadow`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-lg ${TYPE_COLORS[announcement.type]?.split(' ')[0]}`}>
              <TypeIcon className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-navy text-lg">{announcement.title}</h3>
              <p className="text-sm text-textMuted mt-1">
                {moment(announcement.published_at || announcement.created_date).format('MMM D, YYYY [at] h:mm A')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={PRIORITY_COLORS[announcement.priority]}>
              {announcement.priority}
            </Badge>
            {isManager && (
              <div className="flex gap-1">
                {onEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(announcement)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(announcement)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed text-textSecondary">{announcement.message}</p>

        <div className="flex items-center gap-6 text-xs text-textMuted pt-2 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-1">
            <span className="font-medium">{announcement.read_count || 0}</span>
            <span>residents viewed</span>
          </div>
          <div>
            <span className="font-medium capitalize">{announcement.status}</span>
          </div>
          {announcement.notification_sent && (
            <div className="text-green-600 font-medium">✓ Notified</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}