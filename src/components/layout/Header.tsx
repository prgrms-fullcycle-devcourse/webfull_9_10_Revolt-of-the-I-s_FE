import { Plus } from 'lucide-react';
import type { Team } from '../../types';
import { StatusBadge } from '../status/StatusBadge';

interface OnlineUser {
  id: number;
  name: string;
  avatar: string;
  status: string;
  statusColor: string;
}

interface HeaderProps {
  view: 'dashboard' | 'members' | 'archive';
  activeTeam: Team;
  onlineUsers: OnlineUser[];
  setIsCreateModalOpen: (open: boolean) => void;
}

export const Header = ({
  view,
  onlineUsers,
  setIsCreateModalOpen,
}: HeaderProps) => {

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
          {onlineUsers?.map((user) => {
            return (
              <div
                key={user.id}
                className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold shadow-sm relative group"
              >
                <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                  {user.avatar.startsWith('http') || user.avatar.startsWith('/') ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{user.avatar}</span>
                  )}
                </div>

                {/* 유저별 현재 상태 배지: 훅에서 계산해준 statusColor를 바로 사용 */}
                <div className="absolute -bottom-0.5 -right-0.5 z-10">
                  <StatusBadge color={user.statusColor} size="sm" />
                </div>

                {/* 툴팁: 마우스 호버 시 유저명과 상세 상태 표시 */}
                <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl font-bold tracking-tighter">
                  {user.name} ({user.status})
                </div>
              </div>
            );
          })}
        </div>

        {/* 오른쪽: 액션 버튼 섹션 */}
        {view === 'dashboard' && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-black flex items-center gap-2 shadow-md active:scale-95 transition-all"
          >
            <Plus size={18} /> 새 요청
          </button>
        )}
      </div>
    </header>
  );
};