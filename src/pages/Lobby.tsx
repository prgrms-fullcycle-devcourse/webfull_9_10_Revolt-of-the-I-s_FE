/**
 * Lobby 페이지
 * @description 가입된 팀과 가입 가능한 팀을 구분하여 보여주며, 실시간 검색 및 새 팀 개설 기능을 제공합니다.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { Search, PlusCircle, LogOut, Users, X, DoorOpen } from "lucide-react";
import { getTeamsApi, leaveTeamApi } from '../api/team'
import { AVATARS } from '../utils/constants'
import type { Team, TeamFromApi, CurrentUser } from "../types";

interface LobbyProps {
  currentUser: CurrentUser; // 현재 접속한 사용자 정보
  onLogout: () => void; // App.tsx에서 내려준 공통 로그아웃 함수
  setPendingTeamId: (id: string) => void; // 클릭한 팀 ID를 임시로 저장하는 함수 (인증을 시작할 팀)
  setIsTeamAuthorized: (auth: boolean) => void;
  setIsCreateTeamModalOpen: () => void; // 새 팀 만들기 모달 열기
  setIsTeamAuthModalOpen: () => void; // 비밀번호 인증 모달 열기
}

const getDefaultAvatar = (seed: string) => {
  const value = seed
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)

  return AVATARS[value % AVATARS.length]
}

// 프로필 이미지 값이 문자열이면 그대로 쓰고 아니면 빈값 처리 ("null", "undefined" 문자열 및 서버 기본 랜덤 이미지도 제외)
const getAvatarValue = (value: unknown) => {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return ''
  // 서버에서 프로필 미설정 유저에게 자동 부여하는 기본 랜덤 이미지는 제외
  if (trimmed.includes('random-profile')) return ''
  return trimmed
}

// API 응답 TeamFromApi → 기존 Team 타입으로 변환하는 함수
const convertTeam = (team: TeamFromApi): Team => {
  // 기존 members 응답이 있으면 그대로 사용
  const mappedMembers = (team.members ?? []).map((m) => {
    const user = m.user as typeof m.user & {
      profile_image_url?: unknown
      profileImage?: unknown
      avatar?: unknown
    }

    // 서버에서 내려온 이미지 값 중 문자열만 사용
    const avatarImage =
      getAvatarValue(user.profile_image) ||
      getAvatarValue(user.profile_image_url) ||
      getAvatarValue(user.profileImage) ||
      getAvatarValue(user.avatar)

    return {
      id: m.id,
      uuid: user.uuid,
      name: user.name,
      position: m.position,
      // 저장된 이미지가 있으면 그걸 쓰고, 없으면 기본 아바타 사용
      avatar:
        avatarImage ||
        getDefaultAvatar(user.uuid || user.email || user.name),
      email: user.email,
      phone: user.phone,
      github: user.github_url || '',
    }
  })

  // previewImages도 그대로 쓰지 말고, 깨진 랜덤 이미지 경로면 기본 아바타로 대체
  const normalizedPreviewImages: string[] = (team.previewImages ?? []).map(
    (image: string, index: number) =>
      getAvatarValue(image) || getDefaultAvatar(`preview-${team.id}-${index}`)
  )

  // 로비용 응답이면 previewImages를 화면 표시용 members 형태로만 보정
  const previewMembers =
    mappedMembers.length > 0
      ? mappedMembers
      : normalizedPreviewImages.map((image: string, index: number) => ({
          id: index + 1,
          uuid: `preview-${team.id}-${index}`,
          name: `preview-${index}`,
          position: '',
          avatar: image,
          email: '',
          phone: '',
          github: '',
        }))

  return {
    id: String(team.id),
    name: team.name,
    password: '',
    isMember: team.isMember,
    memberCount: team.memberCount ?? previewMembers.length,
    previewImages:
      normalizedPreviewImages.length > 0
        ? normalizedPreviewImages
        : previewMembers.map((m: { avatar?: string }) => m.avatar || '').filter(Boolean),
    members: previewMembers,
    tickets: [],
    logs: [],
    notes: [],
    links: [],
    userStatuses: Object.fromEntries(
      (team.members ?? []).map((m) => [
        m.user.name,
        { label: m.status || '활동 중', color: 'bg-green-500' }
      ])
    ),
  }
}

export const Lobby = ({
  currentUser,
  onLogout,
  setPendingTeamId,
  setIsCreateTeamModalOpen,
  setIsTeamAuthModalOpen,
}: LobbyProps) => {
  // 새로고침 후 저장된 이름도 우선 사용
  const displayName =
    currentUser.name?.trim() || 
    localStorage.getItem('displayName') ||
    currentUser.email?.split('@')[0] || '사용자'

  // 로비 내 팀 검색을 위한 지역 상태
  const [teamSearchQuery, setTeamSearchQuery] = useState("");

  // React Query 캐시 제어용
  const queryClient = useQueryClient();

  // DELETE /teams/{teamId}/members/me 팀 탈퇴 API 호출
  const leaveTeamMutation = useMutation({
    mutationFn: (teamId: number) => leaveTeamApi(teamId),

    // 탈퇴 성공 시 팀 목록 다시 조회
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },

    // 탈퇴 실패 시 에러 메시지 출력
    onError: (error: AxiosError<{ error?: string }>) => {
      alert(error.response?.data?.error || '팀 탈퇴에 실패했습니다.')
    },
  })

  // GET /teams API 호출
  const { data, isLoading, isError } = useQuery({
    queryKey: ['teams'],
    queryFn: getTeamsApi,
    staleTime: 30000,
    gcTime: 30000,
    refetchOnWindowFocus: false,
  })

  // API 응답 데이터를 Team 타입으로 변환
  const teams = data?.data?.map(convertTeam) ?? []

  // 검색어 정리
  const normalizedQuery = teamSearchQuery.trim().toLowerCase();

  // [Helper] 해당 팀에 내가 이미 멤버로 포함되어 있는지 확인
  const isMember = (team: Team) =>
    team.isMember === true;

  // [Helper] 검색어와 팀 이름이 매칭되는지 확인 (대소문자 무시)
  const matchSearch = (team: Team) =>
    !normalizedQuery || team.name.toLowerCase().includes(normalizedQuery);

  // 검색 결과 먼저 필터링
  const filteredTeams = teams.filter((team) => matchSearch(team));

  // 데이터 분류: 내가 속한 팀 vs 내가 속하지 않은 팀 (검색 필터 적용)
  const myTeams = filteredTeams.filter((t) => isMember(t));
  const otherTeams = filteredTeams.filter((t) => !isMember(t));

  // 팀 탈퇴 버튼 클릭 시 해당 팀 탈퇴 API 호출
  const handleLeaveTeam = (team: Team) => {
    leaveTeamMutation.mutate(Number(team.id));
  };

  // 로딩 중 화면
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center text-slate-400 font-bold">
      팀 목록을 불러오는 중...
    </div>
  )

  // 에러 화면
  if (isError) return (
    <div className="min-h-screen flex items-center justify-center text-red-400 font-bold">
      팀 목록을 불러오지 못했습니다.
    </div>
  )

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
        setPendingTeamId(team.id); // 클릭한 팀 ID 저장
        setIsTeamAuthModalOpen(); // 인증 모달(비밀번호 입력) 호출
      }}
      className="relative w-full max-w-[320px] rounded-[28px] bg-white px-6 py-6 shadow-sm border border-slate-100 cursor-pointer transition-all hover:shadow-md"
    >
      {/* 참여 중인 팀만 우측 상단에 탈퇴 버튼 노출 */}
      {isMyTeam && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // 카드 클릭 이벤트 방지
            handleLeaveTeam(team);
          }}
          className="absolute top-5 right-5 text-slate-400 hover:text-red-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1 transition-all"
        >
          팀 탈퇴 <DoorOpen size={12} />
        </button>
      )}

      <div className="flex items-start gap-4 mb-5">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl">
          🏢
        </div>

        <div className="min-w-0 flex-1 pr-16">
          <h3 className="truncate text-lg font-black text-slate-900">
            {team.name}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            <Users size={12} /> {team.memberCount ?? team.members.length}명의 멤버
          </p>
        </div>
      </div>

      {/* 카드 footer : 참여 멤버 아바타 미리보기 및 입장 버튼 */}
      <div className="pt-5 border-t border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {(team.previewImages && team.previewImages.length > 0
                ? team.previewImages.slice(0, 3).map((image, index) => ({
                    id: index + 1,
                    avatar: image,
                    name: `preview-${index}`,
                    email: `preview-${index}`,
                  }))
                : team.members.slice(0, 3)
              ).map((m) => (
              <div
                key={m.id ?? `${m.email}-${m.name}`}
                className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold shadow-sm overflow-hidden"
              >
                {typeof m.avatar === 'string' &&
                (m.avatar.startsWith('http') || m.avatar.startsWith('/')) ? (
                  <>
                    <img
                      src={m.avatar}
                      alt={m.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const next =
                          e.currentTarget.nextElementSibling as HTMLSpanElement | null
                        if (next) next.style.display = 'flex'
                      }}
                    />
                    <span
                      className="w-full h-full items-center justify-center text-sm"
                      style={{ display: 'none' }}
                    >
                      {getDefaultAvatar(m.email || m.name || String(m.id))}
                    </span>
                  </>
                ) : m.avatar ? (
                  <span className="text-sm">{m.avatar}</span>
                ) : (
                  m.name?.slice(0, 1) || '?'
                )}
              </div>
            ))}
          </div>

          <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
            스페이스 입장
          </span>
        </div>
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
                {displayName}님, 작업실을 선택하세요.
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
            onClick={onLogout}
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