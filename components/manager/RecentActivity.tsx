import React from 'react';
import { AlertCircle, CheckCircle2, Clock, MessageSquare } from 'lucide-react';

export interface Activity {
  id: string;
  type: 'case_update' | 'approval' | 'assignment' | 'comment';
  title: string;
  description: string;
  caseNumber?: string;
  timestamp: string;
  priority?: 'high' | 'normal' | 'low';
}

interface RecentActivityProps {
  activities: Activity[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'case_update':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'approval':
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case 'assignment':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-slate-600" />;
    }
  };

  const getActivityBg = (type: string) => {
    switch (type) {
      case 'case_update':
        return 'bg-emerald-50';
      case 'approval':
        return 'bg-amber-50';
      case 'assignment':
        return 'bg-blue-50';
      case 'comment':
        return 'bg-purple-50';
      default:
        return 'bg-slate-50';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
      <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-slate-500" />
        Recent Activity
      </h3>

      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No recent activity</p>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className={`rounded-lg p-3 border border-slate-100 ${getActivityBg(activity.type)} transition-all hover:border-slate-200`}
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{activity.title}</p>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{activity.description}</p>
                      {activity.caseNumber && (
                        <p className="text-xs text-slate-500 mt-1.5 font-mono">
                          Case: {activity.caseNumber}
                        </p>
                      )}
                    </div>
                    {activity.priority && (
                      <span className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${
                        activity.priority === 'high'
                          ? 'bg-red-100 text-red-700'
                          : activity.priority === 'normal'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {activity.priority.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{activity.timestamp}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
