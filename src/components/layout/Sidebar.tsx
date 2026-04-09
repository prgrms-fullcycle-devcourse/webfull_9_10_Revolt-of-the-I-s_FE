import { useState } from 'react'; 
import { LayoutDashboard, Users, FileText, History, ChevronRight, Bell } from 'lucide-react';
import type { Team, CurrentUser } from '../../types';
import { StatusBadge } from '../status/StatusBadge';
import { StatusPicker } from "../status/StatusPicker";

interface SidebarProps {
  activeTeam: Team; // 현재 프로젝트 팀 정보
  currentUser: CurrentUser; // 로그인한 사용자 정보
  view: string; // 현재 화면 위치
  setView: (view: 'dashboard' | 'members' | 'archive') => void; // 화면 전환 함수
  setIsTeamAuthorized: (auth: boolean) => void; // 로비로 나가기 위한 인증 해제 함수
  onLogout: () => void // App.tsx에서 내려준 공통 로그아웃 함수
  activeTeamId: string | null; 
  setActiveTeamId: (id: string | null) => void; // 팀 전환용
  onLeaveTeam: (id: string | number) => void; //팀 탈퇴 함수
  updateMyStatus: (status: string) => Promise<void>; // 서버 상태 업데이트 함수
  activeLogTab: 'all' | 'mine';
  setActiveLogTab: (tab: 'all' | 'mine') => void;
}

export const Sidebar = ({ 
  activeTeam, 
  currentUser, 
  view, 
  setView, 
  setIsTeamAuthorized,
  onLogout,
  updateMyStatus,
  activeTeamId,
  onLeaveTeam,
  activeLogTab,
  setActiveLogTab
}: SidebarProps) => {
  // 상태 선택 팝업창의 열림/닫힘 여부
  const [isStatusPickerOpen, setIsStatusPickerOpen] = useState(false);

  // 내 현재 상태 정보 가져오기 (기본값: 개발 중)
  const myStatus = activeTeam?.userStatuses?.[currentUser.name] || { 
    label: '개발 중', 
    color: 'bg-green-500' 
  };

  const displayLogs = activeTeam.logs;

  const LOG_STYLES = {
    // 1. 초록색 (성공, 승인, 상태 변경 등 긍정적인 신호)
    success: { dot: 'bg-green-500', border: 'border-green-200', text: 'text-green-600', bg: 'bg-green-50/30' },
    
    // 2. 파란색 (새 업무 발행, 수락, 일반적인 진행 사항)
    info: { dot: 'bg-blue-500', border: 'border-blue-200', text: 'text-blue-600', bg: 'bg-blue-50/30' },
    
    // 3. 빨간색 (반려, 취소, 삭제 등 주의가 필요한 사항)
    error: { dot: 'bg-red-500', border: 'border-red-400', text: 'text-red-600', bg: 'bg-red-50/50' },
    
    // 4. 회색 (기본값, 입장/퇴장 등 일반 로그)
    default: { dot: 'bg-slate-400', border: 'border-slate-200', text: 'text-slate-500', bg: '' },
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
        {/* 로그 헤더: 로고와 탭 전환 버튼 */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <History size={14} className="text-blue-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Log</span>
          </div>
          
          <div className="flex bg-slate-200/50 p-0.5 rounded-lg">
            <button 
              onClick={() => setActiveLogTab('all')}
              className={`text-[9px] px-2 py-1 rounded-md transition-all font-bold ${activeLogTab === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
            >
              로그
            </button>
            <button 
              onClick={() => setActiveLogTab('mine')}
              className={`text-[9px] px-2 py-1 rounded-md transition-all font-bold ${activeLogTab === 'mine' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
            >
              내 소식
            </button>
          </div>
        </div>
          
          {/* 로그 리스트 */}
          <div className="space-y-3 max-h-40 overflow-y-auto pr-1 scrollbar-hide min-h-40">
          {displayLogs.length > 0 ? (
              displayLogs.map((log) => {
                const style = LOG_STYLES[log.type as keyof typeof LOG_STYLES] || LOG_STYLES.default;

      return (
        <div key={log.id} className={`relative pl-3 border-l ${style.border} ${style.bg} transition-all py-1`}>
          {/* 상태 변경 점 색상 적용 */}
          <div className={`absolute left-[-3.5px] top-2 w-1.5 h-1.5 rounded-full ${style.dot}`} />
          
          <div className="flex justify-between items-start leading-none mb-1">
            <span className="text-[10px] font-bold text-slate-700">{log.user}</span>
            <span className="text-[8px] font-mono text-slate-400">{log.time}</span>
          </div>
          
          {/* 텍스트 색상 적용 */}
          <p className={`text-[9px] truncate ${style.text} font-medium`}>
            <span className="opacity-70 mr-1">
              {log.ticketId > 0 && !log.action.includes('#') 
                ? `#${String(log.ticketId).replace('#', '')}` 
                : (log.ticketId === 0 ? 'Entry' : '')}
            </span>
            {log.action}
          </p>
        </div>
      );
    })
  ) : (
              <div className="h-full flex flex-col items-center justify-center py-8 text-slate-300">
                <Bell size={20} className="mb-2 opacity-20" />
                <p className="text-[10px] font-medium">새로운 소식이 없습니다.</p>
              </div>
            )
            }
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
            {currentUser.name?.[0] || '?'}
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
            onStatusChange={async (act) => {
              console.log(`[Step 1] 상태 변경 클릭됨: ${act.label}`);
              
              try {
                // 서버 API 호출 및 Pusher 방송 유도
                console.log(`[Step 2] 서버에 상태 업데이트 요청 중...`);
                await updateMyStatus(act.label); 
                
                // UI 닫기
                setIsStatusPickerOpen(false);
                
                console.log(`[Step 3] 상태 변경 프로세스 완료! (Pusher 방송 대기 중)`);
              } catch (error) {
                console.error(`[Error] 상태 변경 중 오류 발생:`, error);
                alert("상태를 변경하지 못했습니다. 다시 시도해주세요.");
              }
            }}
            onLogout={() => {
              onLogout(); // App.tsx의 로그아웃 API + 상태 초기화 함수 실행
            }}
            handleLeaveTeam={() => {
            // activeTeamId가 null일 수도 있으므로 안전하게 처리
            if (activeTeamId) {
              onLeaveTeam(activeTeamId); // App.tsx의 handleLeaveTeam 실행
              setIsStatusPickerOpen(false); // 실행 후 팝업 닫기
            }
          }}      
          />
        )}
      </div>
    </aside>
  );
};