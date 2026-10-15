import React from 'react';
import { TrendingUp } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  cases: number;
  status: 'active' | 'idle' | 'offline';
}

interface TeamPerformanceProps {
  teamMembers: TeamMember[];
}

export const TeamPerformance: React.FC<TeamPerformanceProps> = ({ teamMembers }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'idle':
        return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'offline':
        return 'bg-slate-100 text-slate-700 border border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 mb-6">
      <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-slate-500" />
        Team Performance
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {teamMembers.map((member) => (
          <div
            key={member.id}
            className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 leading-tight">
                  {member.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{member.role}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(member.status)}`}>
                {member.status === 'active' ? '🟢 Active' : member.status === 'idle' ? '🟡 Idle' : '⚫ Offline'}
              </span>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900">{member.cases}</span>
              <span className="text-xs text-slate-500">cases</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
