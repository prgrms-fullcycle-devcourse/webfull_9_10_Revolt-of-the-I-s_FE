/**
 * Lobby 페이지
 * @description 가입된 팀과 가입 가능한 팀을 구분하여 보여주며, 실시간 검색 및 새 팀 개설 기능을 제공합니다.
 */

import { useState } from 'react';
import { Search, PlusCircle, LogOut, Users, X } from 'lucide-react';
import type { Team, CurrentUser } from '../types';

interface LobbyProps {
  teams: Team[];                    // 전체 프로젝트(팀) 배열
  currentUser: CurrentUser;          // 현재 접속한 사용자 정보
  setCurrentUser: (user: null) => void; // 시스템 로그아웃 함수
  setActiveTeamId: (id: string) => void; // 클릭한 팀을 활성화하는 함수
  setIsTeamAuthorized: (auth: boolean) => void; 
  setIsCreateTeamModalOpen: () => void; // 새 팀 만들기 모달 열기
  setIsTeamAuthModalOpen: () => void;   // 비밀번호 인증 모달 열기
}

export const Lobby = ({
  teams,
  currentUser,
  setCurrentUser,
  setActiveTeamId,
  setIsCreateTeamModalOpen,
  setIsTeamAuthModalOpen,
}: LobbyProps) => {
  // 로비 내 팀 검색을 위한 지역 상태
  const [teamSearchQuery, setTeamSearchQuery] = useState('');

  // [Helper] 해당 팀에 내가 이미 멤버로 포함되어 있는지 확인
  const isMember = (team: Team) => team.members.some((m) => m.name === currentUser.name);
  
  // [Helper] 검색어와 팀 이름이 매칭되는지 확인 (대소문자 무시)
  const matchSearch = (team: Team) =>
    !teamSearchQuery.trim() || team.name.toLowerCase().includes(teamSearchQuery.trim().toLowerCase());

  // 데이터 분류: 내가 속한 팀 vs 내가 속하지 않은 팀 (검색 필터 적용)
  const myTeams = teams.filter((t) => isMember(t) && matchSearch(t));
  const otherTeams = teams.filter((t) => !isMember(t) && matchSearch(t));

  /**
   * TeamCard 내부 컴포넌트
   * @description 개별 팀의 정보를 카드 형태로 렌더링합니다.
   */
  const TeamCard = ({ team }: { team: Team }) => (
    <div
      onClick={() => {
        setActiveTeamId(team.id); // 클릭한 팀 ID 저장
        setIsTeamAuthModalOpen(); // 인증 모달(비밀번호 입력) 호출
      }}
      className="bg-white p-8 rounded-[40px] border-4 border-transparent hover:border-blue-500 hover:shadow-2xl transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-5 mb-6">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
          🏢
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-900 leading-tight">{team.name}</h3>
          <p className="text-xs text-slate-400 font-bold flex items-center gap-1 mt-1">
            <Users size={12} /> {team.members.length}명의 멤버
          </p>
        </div>
      </div>
      
      {/* 카드 footer : 참여 멤버 아바타 미리보기 및 입장 버튼 */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-50">
        <div className="flex -space-x-2">
          {team.members.slice(0, 3).map((m, i) => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold shadow-sm">
              {m.avatar}
            </div>
          ))}
        </div>
        <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest group-hover:bg-blue-600 group-hover:text-white transition-colors">
          스페이스 입장
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-8 text-slate-800">
      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col">
        
        {/* 상단 헤더: 유저 환영 메시지 및 팀 생성 액션 */}
        <header className="flex justify-between items-start mb-8">
          <div className="flex flex-wrap items-end gap-8">
            <div>
              <h2 className="text-4xl font-black tracking-tight mb-2">Team Lobby</h2>
              <p className="text-slate-500 font-bold">{currentUser.name}님, 작업실을 선택하세요.</p>
            </div>
            <button
              onClick={setIsCreateTeamModalOpen}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg transition-all active:scale-95"
            >
              <PlusCircle size={18} /> 새 팀 개설하기
            </button>
          </div>
          <button
            onClick={() => setCurrentUser(null)}
            className="text-slate-400 hover:text-red-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all py-2.5"
          >
            로그아웃 <LogOut size={14} />
          </button>
        </header>

        {/* 실시간 팀 검색 필터 영역 */}
        <div className="relative mb-8">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={teamSearchQuery}
            onChange={(e) => setTeamSearchQuery(e.target.value)}
            placeholder="팀 이름으로 검색..."
            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-slate-800 font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          {teamSearchQuery && (
            <button onClick={() => setTeamSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
              <X size={18} />
            </button>
          )}
        </div>

        {/* 팀 목록 영역: 참여 여부에 따른 섹션 분리 */}
        <div className="flex-1 space-y-10">
          {/* 내가 속한 팀 (섹션 표시 여부를 조건부로 결정) */}
          {myTeams.length > 0 && (
            <section>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">참여 중인 팀</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myTeams.map((team) => <TeamCard key={team.id} team={team} />)}
              </div>
            </section>
          )}
          
          {/* 가입 가능한 다른 팀들 */}
          <section>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
              {myTeams.length > 0 ? '입장 가능한 팀' : '팀 목록'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {otherTeams.map((team) => <TeamCard key={team.id} team={team} />)}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};