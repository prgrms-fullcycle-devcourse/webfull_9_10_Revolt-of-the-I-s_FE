import { Plus, Bell } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { CurrentUser, Team } from '../../types';
import { StatusBadge } from '../status/StatusBadge';
import { useNotifications } from '../../hooks/useNotifications';

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
  currentUser: CurrentUser;
  setSelectedTicketId: (id: number | null) => void;
}

export const Header = ({
  view,
  onlineUsers,
  setIsCreateModalOpen,
  currentUser,
  setSelectedTicketId
}: HeaderProps) => {
  const { 
    notifications,
    unreadCount,
    readNotification, 
    readAllNotifications 
  } = useNotifications(currentUser?.uuid);

  // 알림 창 열림/닫힘 상태
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const notiRef = useRef<HTMLDivElement>(null);

  // 알림 창 바깥 클릭 시 닫기 로직
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notiRef.current && !notiRef.current.contains(e.target as Node)) {
        setIsNotiOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

        {/* 알림 아이콘 섹션 */}
        <div className="relative" ref={notiRef}>
          <button
            onClick={() => setIsNotiOpen(!isNotiOpen)}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all relative"
          >
            <Bell size={22} />
            {/* 읽지 않은 알림 배지 */}
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* 알림 센터 팝업 (알림 목록 렌더링) */}
          {isNotiOpen && (
            <div className="absolute right-0 mt-3 w-85 bg-white border border-slate-200 shadow-2xl rounded-[28px] overflow-hidden z-100 animate-in fade-in slide-in-from-top-2">
              <div className="p-5 border-b border-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-slate-800 text-sm">알림 센터</h4>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {/* 전체 읽음 버튼 */}
                <button 
                  onClick={() => readAllNotifications()}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  모두 읽음 처리
                </button>
              </div>
              
              <div className="max-h-100 overflow-y-auto scrollbar-hide">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-xs font-bold">
                    표시할 알림이 없습니다.
                  </div>
                ) : (
                  notifications.map((noti) => (
                    <div
                      key={noti.id}
                      onClick={() => {
                        // 특정 알림 클릭 시 읽음 처리 API 호출
                        readNotification(noti.id);
                        if (noti.task_id) setSelectedTicketId(noti.task_id);
                        setIsNotiOpen(false);
                      }}
                      className={`p-4 border-b border-slate-50 cursor-pointer transition-all relative flex gap-3 ${
                        noti.isNew ? 'bg-blue-50/30' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex-1">
                      {/* 팀 이름 배지 추가 */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black rounded-md uppercase tracking-tighter border border-slate-200">
                          Team : {noti.teamName || '알 수 없는 팀'}
                        </span>
                        {/* 읽지 않은 알림 New 점 표시 */}
                        {!noti.is_read && (
                          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
                        )}
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <p className={`text-[11px] leading-relaxed ${!noti.is_read ? 'font-black text-slate-900' : 'font-bold text-slate-500'}`}>
                          {noti.message}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-bold text-slate-300 uppercase">
                            {new Date(noti.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {!noti.is_read && (
                      <span className="text-[8px] font-black text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-md h-fit">NEW</span>
                    )}
                  </div>
                  ))
                )}
              </div>
            </div>
          )}
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