import { Mail, Github, SquarePen, Smartphone, ArrowRight } from 'lucide-react';
import type { Member, Team, CurrentUser } from '../types';

interface MembersProps {
  activeTeam: Team;
  currentUser: CurrentUser;
  updatePosition: (open: Member) => void; // 포지션 변경 모달 함수
}

export const Members = ({
  activeTeam,
  currentUser,
  updatePosition,
}: MembersProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {activeTeam.members.map((member) => {
        const isMe = member.name === currentUser.name; // api연결시 name->uuid로 변경해야함

        return (
          <div
            key={member.id ?? `${member.email}-${member.name}`}
            className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col items-center"
          >
            {/* 아바타 섹션 */}
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-4xl shadow-inner">
                {member.avatar ? (
                  member.avatar.startsWith('http') ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-full h-full rounded-3xl object-cover"
                    />
                  ) : (
                    <span>{member.avatar}</span>  // 이모지는 그냥 텍스트로 렌더링
                  )
                ) : (
                  <span className="text-2xl font-black text-slate-400">
                    {member.name[0]}
                  </span>
                )}
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
            {isMe ? (
              <button
                onClick={() => updatePosition(member)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2 cursor-pointer"
              >
                {member.position || '팀원'}
                <SquarePen size={16} className="text-blue-600 shrink-0" />
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2">
                {member.position || '팀원'}
              </div>
            )}

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
                {member.email}
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl text-[13px] font-medium text-slate-700">
                <Smartphone size={16} className="text-slate-400 shrink-0" />{' '}
                전화번호가 노출
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
        );
      })}
    </div>
  );
};
