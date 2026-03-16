import { useState } from 'react'; 
import { LayoutDashboard, Users, FileText, History, ChevronRight } from 'lucide-react';
import type { Team, CurrentUser } from '../../types';
import { StatusBadge } from '../status/StatusBadge';
import { StatusPicker } from "../status/StatusPicker";

interface SidebarProps {
  activeTeam: Team; // 현재 프로젝트 팀 정보
  currentUser: CurrentUser; // 로그인한 사용자 정보
  view: string; // 현재 화면 위치
  setView: (view: 'dashboard' | 'members' | 'archive') => void; // 화면 전환 함수
  setIsTeamAuthorized: (auth: boolean) => void; // 로비로 나가기 위한 인증 해제 함수
  setCurrentUser: (user: CurrentUser | null) => void; // 로그아웃용
  activeTeamId: string | null; 
  setActiveTeamId: (id: string | null) => void; // 팀 전환용
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>; // 유저 상태 업데이트 함수
  addLog: (ticketId: number, user: string, action: string, type?: 'default' | 'info' | 'success' | 'error') => void; // 활동 로그 기록 함수
}

export const Sidebar = ({ 
  activeTeam, 
  currentUser, 
  view, 
  setView, 
  setIsTeamAuthorized,
  setCurrentUser,
  activeTeamId,
  setActiveTeamId,
  setTeams,
  addLog 
}: SidebarProps) => {
  // 상태 선택 팝업창의 열림/닫힘 여부
  const [isStatusPickerOpen, setIsStatusPickerOpen] = useState(false);

  // 내 현재 상태 정보 가져오기 (기본값: 활동 중)
  const myStatus = activeTeam.userStatuses[currentUser.name] || { 
    label: '활동 중', 
    color: 'bg-green-500' 
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
      {/* 상단 로고 및 내비게이션 영역 */}
      <div className="p-6 shrink-0">
        <button onClick={() => { setIsTeamAuthorized(false); setView('dashboard'); }} className="group flex items-center gap-2 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
          <ChevronRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> Exit to Lobby
        </button>
        <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
          <LayoutDashboard size={20} /> i-Station
        </h1>
        <p className="text-[10px] text-slate-400 mt-1 font-black italic tracking-tighter truncate">{activeTeam.name}</p>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto min-h-0">
        {/* nav 버튼들 */}
        <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${view === 'dashboard' ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}>
          <LayoutDashboard size={18} /> 칸반 보드
        </button>
        <button onClick={() => setView('members')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${view === 'members' ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}>
          <Users size={18} /> 팀원 정보
        </button>
        <button onClick={() => setView('archive')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${view === 'archive' ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}>
          <FileText size={18} /> 아카이브
        </button>
      </nav>

      {/* 히스토리 로그 영역 */}
      <div className="px-4 mb-4 shrink-0">
        <div className="bg-slate-50/80 rounded-2xl border border-slate-100 p-3">
          <div className="flex items-center gap-2 mb-3 px-1">
            <History size={14} className="text-blue-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Log</span>
          </div>
          
          {/* 로그 리스트 */}
          <div className="space-y-3 max-h-35 overflow-y-auto pr-1 scrollbar-hide">
            {activeTeam.logs.map((log) => {
              console.log("로그 타입 확인:", log.type);
              // 로그 타입별 색상 매핑
              const logStyles = {
                default: { dot: 'bg-slate-400', border: 'border-slate-200', text: 'text-slate-500', bg: '' },
                info: { dot: 'bg-blue-500', border: 'border-blue-200', text: 'text-blue-600', bg: 'bg-blue-50/30' },
                success: { dot: 'bg-green-500', border: 'border-green-200', text: 'text-green-600', bg: 'bg-green-50/30' },
                error: { dot: 'bg-red-500', border: 'border-red-400', text: 'text-red-600', bg: 'bg-red-50/50' },
              };

              // log.type이 없으면 default(회색) 사용
              const style = logStyles[log.type as keyof typeof logStyles] || logStyles.default;

              return (
                <div key={log.id} className={`relative pl-3 border-l ${style.border} ${style.bg} transition-all py-1`}>
                  <div className={`absolute left-[-3.5px] top-2 w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  <div className="flex justify-between items-start leading-none mb-1">
                    <span className="text-[10px] font-bold text-slate-700">{log.user}</span>
                    <span className="text-[8px] font-mono text-slate-400">{log.time}</span>
                  </div>
                  <p className={`text-[9px] truncate ${style.text} font-medium`}>
                    <span className="opacity-70 mr-1">
                      {log.ticketId > 0 ? `#${log.ticketId.toString().slice(-2)}` : 'Entry'}
                    </span>
                    {log.action}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 하단 내 상태 및 로그아웃 영역 */}
      <div className="p-4 border-t border-slate-200 bg-[#0F172A] relative shrink-0">
        <div
          onClick={() => setIsStatusPickerOpen(!isStatusPickerOpen)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-slate-700 hover:bg-slate-800/50 group"
        >
          {/* MemberStatusItem으로 내 정보 표시 */}
          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-xs">
            {currentUser.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
            <StatusBadge color={myStatus.color} label={myStatus.label} showLabel size="sm" />
          </div>
          <ChevronRight size={14} className={`text-slate-400 ${isStatusPickerOpen ? 'rotate-90' : ''}`} />
        </div>

        {/* StatusPicker 컴포넌트 사용 */}
        {isStatusPickerOpen && (
          <StatusPicker 
            currentStatusLabel={myStatus.label}
            onStatusChange={(act) => {
              setTeams(prev => prev.map(t => t.id === activeTeamId ? { ...t, userStatuses: { ...t.userStatuses, [currentUser.name]: act } } : t));
              setIsStatusPickerOpen(false);
              // 상태 변경 로그는 info(파란색) 타입으로 기록
              addLog(0, currentUser.name, `상태: ${act.label}`, 'info');
            }}
            onLogout={() => {
              setCurrentUser(null);
              setActiveTeamId(null);
              setIsTeamAuthorized(false);
            }}
          />
        )}
      </div>
    </aside>
  );
};