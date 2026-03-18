/**
 * Lobby 페이지
 * @description 가입된 팀과 가입 가능한 팀을 구분하여 보여주며, 실시간 검색 및 새 팀 개설 기능을 제공합니다.
 */

import { useState } from "react";
import { Search, PlusCircle, LogOut, Users, X } from "lucide-react";
import type React from "react";
import type { Team, CurrentUser } from "../types";

interface LobbyProps {
  teams: Team[]; // 전체 프로젝트(팀) 배열
  currentUser: CurrentUser; // 현재 접속한 사용자 정보
  setCurrentUser: React.Dispatch<React.SetStateAction<CurrentUser | null>>; // 시스템 로그아웃 함수
  setActiveTeamId: (id: string) => void; // 클릭한 팀을 활성화하는 함수
  setIsTeamAuthorized: (auth: boolean) => void;
  setIsCreateTeamModalOpen: () => void; // 새 팀 만들기 모달 열기
  setIsTeamAuthModalOpen: () => void; // 비밀번호 인증 모달 열기
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
  const [teamSearchQuery, setTeamSearchQuery] = useState("");

  // 검색어 정리
  const normalizedQuery = teamSearchQuery.trim().toLowerCase();

  // [Helper] 해당 팀에 내가 이미 멤버로 포함되어 있는지 확인
  const isMember = (team: Team) =>
    team.members.some((m) => m.name === currentUser.name);

  // [Helper] 검색어와 팀 이름이 매칭되는지 확인 (대소문자 무시)
  const matchSearch = (team: Team) =>
    !normalizedQuery || team.name.toLowerCase().includes(normalizedQuery);

  // 검색 결과 먼저 필터링
  const filteredTeams = teams.filter((team) => matchSearch(team));

  // 데이터 분류: 내가 속한 팀 vs 내가 속하지 않은 팀 (검색 필터 적용)
  const myTeams = filteredTeams.filter((t) => isMember(t));
  const otherTeams = filteredTeams.filter((t) => !isMember(t));

  // 팀 탈퇴 콘솔 확인용
  const handleLeaveTeam = (team: Team) => {
    console.log("팀 탈퇴 클릭", {
      teamId: team.id,
      teamName: team.name,
      userName: currentUser.name,
    });
  };

  /**
   * TeamCard 내부 컴포넌트
   * @description 개별 팀의 정보를 카드 형태로 렌더링합니다.
   */
  const TeamCard = ({
    team,
    isMyTeam,
  }: {
    team: Team;
    isMyTeam: boolean;
  }) => (
    <div
      onClick={() => {
        setActiveTeamId(team.id); // 클릭한 팀 ID 저장
        setIsTeamAuthModalOpen(); // 인증 모달(비밀번호 입력) 호출
      }}
      className="w-full max-w-[320px] rounded-[28px] bg-white px-6 py-6 shadow-sm border border-slate-100 cursor-pointer transition-all hover:shadow-md"
    >
      <div className="flex items-start gap-4 mb-5">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl">
          🏢
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-black text-slate-900">
            {team.name}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            <Users size={12} /> {team.members.length}명의 멤버
          </p>
        </div>
      </div>

      {/* 카드 footer : 참여 멤버 아바타 미리보기 및 입장 버튼 */}
      <div className="pt-5 border-t border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {team.members.slice(0, 3).map((m, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold shadow-sm"
              >
                {m.avatar || m.name.slice(0, 1)}
              </div>
            ))}
          </div>

          <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
            스페이스 입장
          </span>
        </div>

        {/* 참여 중인 팀만 탈퇴 버튼 노출 */}
        {isMyTeam && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation(); // 카드 클릭 이벤트 방지
              handleLeaveTeam(team);
            }}
            className="w-full rounded-2xl border border-red-200 bg-red-50 py-2.5 text-xs font-black tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-colors"
          >
            팀 탈퇴
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-8 text-slate-800">
      <div className="max-w-5xl w-full mx-auto flex-1 flex flex-col">
        {/* 상단 헤더: 유저 환영 메시지 및 팀 생성 액션 */}
        <header className="flex justify-between items-start mb-8 gap-6">
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <h2 className="text-4xl font-black tracking-tight mb-2">
                Team Lobby
              </h2>
              <p className="text-slate-500 font-bold">
                {currentUser.name}님, 작업실을 선택하세요.
              </p>
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
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={teamSearchQuery}
            onChange={(e) => setTeamSearchQuery(e.target.value)}
            placeholder="팀 이름으로 검색..."
            className="w-full pl-12 pr-10 py-4 bg-white border border-slate-200 rounded-2xl text-slate-800 font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          {teamSearchQuery && (
            <button
              onClick={() => setTeamSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* 팀 목록 영역: 참여 여부에 따른 섹션 분리 */}
        <div className="flex-1 space-y-10">
          {/* 내가 속한 팀 (섹션 표시 여부를 조건부로 결정) */}
          {myTeams.length > 0 && (
            <section>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
                참여 중인 팀
              </h3>
              <div className="flex flex-wrap gap-6">
                {myTeams.map((team) => (
                  <TeamCard key={team.id} team={team} isMyTeam />
                ))}
              </div>
            </section>
          )}

          {/* 가입 가능한 다른 팀들 */}
          {otherTeams.length > 0 && (
            <section>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
                입장 가능한 팀
              </h3>
              <div className="flex flex-wrap gap-6">
                {otherTeams.map((team) => (
                  <TeamCard key={team.id} team={team} isMyTeam={false} />
                ))}
              </div>
            </section>
          )}

          {/* 검색 결과가 없을 때 */}
          {myTeams.length === 0 && otherTeams.length === 0 && (
            <div className="bg-white border border-dashed border-slate-200 rounded-4xl p-10 text-center text-slate-400 font-bold">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};