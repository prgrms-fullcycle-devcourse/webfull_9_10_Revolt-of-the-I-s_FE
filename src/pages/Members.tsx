import { Mail, Github, ArrowRight } from 'lucide-react';
import type { Team } from '../types';

interface MembersProps {
  activeTeam: Team;
}

export const Members = ({ activeTeam }: MembersProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {activeTeam.members.map((member) => (
        <div
          key={member.name}
          className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col items-center"
        >
          {/* 아바타 섹션 */}
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-4xl shadow-inner">
              {member.avatar}
            </div>
            <span
              className={`absolute bottom-1 right-1 w-5 h-5 border-4 border-white rounded-full ${
                activeTeam.userStatuses[member.name]?.color ?? 'bg-green-500'
              }`}
            />
          </div>

          {/* 이름 및 직무 */}
          <h3 className="text-xl font-black text-slate-900 mb-1">
            {member.name}
          </h3>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2">
            {member.position}
          </div>

          {/* 현재 상태 */}
          <div className="text-[10px] font-bold text-slate-400 mb-6 flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                activeTeam.userStatuses[member.name]?.color ?? 'bg-green-500'
              }`}
            />
            {activeTeam.userStatuses[member.name]?.label ?? '활동 중'}
          </div>

          {/* 연락처 정보 */}
          <div className="w-full space-y-3 pt-6 border-t border-slate-50">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl text-[13px] font-medium text-slate-700">
              <Mail size={16} className="text-slate-400 shrink-0" />{' '}
              {member.email || '이메일 미등록'}
            </div>
            {member.github && (
              <a
                href={member.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-slate-900 rounded-2xl text-[13px] font-medium text-white hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Github size={16} className="text-slate-400 shrink-0" />{' '}
                  GitHub
                </div>
                <ArrowRight size={14} />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};