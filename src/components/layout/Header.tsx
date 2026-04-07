import { Plus } from 'lucide-react';
import type { Team, Member } from '../../types';
import { StatusBadge } from '../status/StatusBadge';

interface HeaderProps {
  view: 'dashboard' | 'members' | 'archive'; // 현재 활성화된 화면 뷰
  activeTeam: Team; // 현재 사용자가 속한 팀 데이터
  setIsCreateModalOpen: (open: boolean) => void; // 새 업무 요청 모달 열기 함수
}

export const Header = ({ view, activeTeam, setIsCreateModalOpen }: HeaderProps) => {
  
  // '자리 비움'이 아닌 팀원들만 필터링하여 상단에 노출
  const onlineUsers = activeTeam.members.filter((m: Member) => {
    const status = activeTeam.userStatuses[m.name];
    return status && status.label !== '자리 비움';
  });

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
      {/* 왼쪽: 뷰 타이틀 섹션 */}
      <h2 className="text-lg font-black flex items-center gap-2 text-slate-800">
        {view === 'dashboard' && '🚀 칸반 보드'}
        {view === 'members' && '👥 팀원 정보'}
        {view === 'archive' && '📑 팀 아카이브'}
      </h2>

      <div className="flex items-center gap-4">
        {/* 오른쪽: 온라인 유저 아바타 스택 */}
        <div className="flex -space-x-2 mr-2">
          {onlineUsers.map((member) => {
            // 해당 멤버의 실제 상태 데이터 가져오기
            const userStatus = activeTeam.userStatuses[member.name];

            return (
              <div
                key={member.id ?? `${member.email}-${member.name}`}
                className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold shadow-sm relative group"
              >
                {member.avatar}
                {/* 유저별 현재 상태 배지 (StatusBadge 재사용) */}
                <div className="absolute -bottom-0.5 -right-0.5 z-10">
                  <StatusBadge 
                    color={userStatus?.color} 
                    size="sm" 
                  />                  
                </div>

                {/* 툴팁: 마우스 호버 시 유저명과 상세 상태 표시 */}
                <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl font-bold tracking-tighter">
                  {member.name} ({userStatus?.label || '활동 중'})
                </div>
              </div>
            );
          })}
        </div>
        
        {/* 오른쪽: 액션 버튼 섹션 (대시보드에서만 새 업무 발행 가능) */}
        {view === 'dashboard' && (
          <button
            onClick={() => {
                console.log("새 요청 버튼 클릭됨"); 
                setIsCreateModalOpen(true);
              }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-black flex items-center gap-2 shadow-md active:scale-95 transition-all"
          >
            <Plus size={18} /> 새 요청
          </button>
        )}
      </div>
    </header>
  );
};