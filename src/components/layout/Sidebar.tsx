import { useState, useRef } from 'react'; 
import { LayoutDashboard, Users, FileText, History, ChevronRight, Bell, Pencil } from 'lucide-react';
import type { Team, CurrentUser } from '../../types';
import { StatusBadge } from '../status/StatusBadge';
import { StatusPicker } from "../status/StatusPicker";
// import { updateProfileImageApi } from "../../api/member";

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
  updateProfileImage: (formData: FormData) => void;
}

export const Sidebar = ({ 
  activeTeam, 
  updateProfileImage,
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 내 현재 상태 정보 가져오기 (기본값: 개발 중)
  const myStatus = activeTeam?.userStatuses?.[currentUser.uuid] || { 
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

  // 이미지 변경 
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('profileImage', file);
      updateProfileImage(formData);
    }
  };

  // 1. 현재 팀원 목록에서 '나(이메일 기준)'를 찾습니다.
const myInfoFromTeam = activeTeam?.members.find(m => m.email === currentUser?.email);

// 2. 팀원 목록에 내가 있다면 그 사진(avatar)을 쓰고, 없으면 기존 정보를 씁니다.
const finalAvatar = myInfoFromTeam?.avatar || currentUser?.avatar;
  
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
                const currentType = (log.type && LOG_STYLES[log.type as keyof typeof LOG_STYLES]) 
                  ? (log.type as keyof typeof LOG_STYLES) 
                  : 'default';
                const style = LOG_STYLES[currentType];

      return (
        <div 
          key={log.id} 
          className={`relative pl-3 border-l ${style.border} ${style.bg} transition-all py-2 rounded-r-lg`}>
          {/* 상태 변경 점 색상 적용 */}
          <div className={`absolute -left-1.25 top-3 w-2 h-2 rounded-full ${style.dot} ring-2 ring-white `} />
          
          <div className="flex justify-between items-start leading-none mb-1">
            <span className="text-[10px] font-bold text-slate-700">{log.user}</span>
            <span className="text-[8px] font-mono text-slate-400">{log.time}</span>
          </div>
          
          {/* 텍스트 색상 적용 */}
          <p className={`text-[11px] leading-snug ${style.text} font-bold wrap-break-word`}>
            <span className="opacity-60 mr-1 text-[10px] font-mono">
              {log.ticketId > 0 && !log.action.includes('#') 
                ? `#${String(log.ticketId).replace('#', '')}` 
                : (log.ticketId === 0 ? '[Entry]' : '')}
            </span>
            {log.action}
          </p>
            {/* 시간 */}
            {/* <div className="flex justify-end mt-1">
              <span className="text-[9px] font-mono text-slate-400 opacity-80">
                {log.time}
              </span>
            </div> */}
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
        {/* 숨겨진 파일 선택 Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-transparent transition-all group/info">
        {/* 아바타/이미지 영역 */}
        <div 
          key={currentUser.avatar}
          className="relative w-9 h-9 rounded-full shrink-0 cursor-pointer group/avatar overflow-hidden bg-slate-800 flex items-center justify-center"
          onClick={() => fileInputRef.current?.click()}
        >
          {/* ✅ 1순위: currentUser.avatar (가져온 프로필 이미지)가 있으면 이미지 표시 */}
          {currentUser?.avatar ? (
          <img 
            src={finalAvatar}
            className="w-full h-full object-cover"
            alt="프로필"
            key={finalAvatar}
          />
        ) : (
          <div className="w-full h-full bg-slate-200 flex items-center justify-center">
            <span className="text-lg font-black text-slate-400">
              {currentUser?.name?.[0] || 'U'}
            </span>
          </div>
        )}

          {/* 마우스 호버 시 오버레이 디자인 개선 */}
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 z-20 backdrop-blur-[1px]">
            <Pencil size={16} className="text-white" />
          </div>
        </div>

        {/* 이름 및 상태 정보 (클릭 시 상태 피커 열기) */}
        <div 
          className="flex-1 min-w-0 cursor-pointer" 
          onClick={() => setIsStatusPickerOpen(!isStatusPickerOpen)}
        >
          <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
          <StatusBadge color={myStatus.color} label={myStatus.label} showLabel size="sm" />
        </div>

        <ChevronRight 
          size={14} 
          className={`text-slate-400 cursor-pointer transition-transform ${isStatusPickerOpen ? 'rotate-90' : ''}`} 
          onClick={() => setIsStatusPickerOpen(!isStatusPickerOpen)}
        />
      </div>

        {/* StatusPicker 컴포넌트 사용 */}
        {isStatusPickerOpen && (
          <StatusPicker 
            currentStatusLabel={myStatus.label}
            onStatusChange={async (act) => {              
              try {
                // 서버 API 호출 및 Pusher 방송 유도
                await updateMyStatus(act.label); 
                
                // UI 닫기
                setIsStatusPickerOpen(false);
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