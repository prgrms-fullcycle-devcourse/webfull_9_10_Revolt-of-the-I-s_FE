/**
 * useTeams 커스텀 훅
 * @description 팀 데이터(Team), 티켓(Ticket), 활동 로그(Log)의 상태 관리 및 비즈니스 로직을 총괄합니다.
 * @param currentUser 현재 접속한 유저 정보 (로그 기록 및 권한 확인용)
 */

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Team, Ticket, CurrentUser, TeamFromApi } from '../types';
import { INITIAL_TEAM, AVATARS } from '../utils/constants';
import { getTeamsApi } from '../api/team';
import { formatLogTime } from '../utils/format';
import { deleteTicketApi, getTicketDetailApi, getTicketsApi } from "../api/tickets";

// API 응답 TeamFromApi → 기존 Team 타입으로 변환하는 함수
const convertTeam = (team: TeamFromApi): Team => ({
  id: String(team.id),
  name: team.name,
  password: '',
  isMember: team.isMember,
  members: team.members.map((m) => ({
    id: m.id,
    uuid: m.user.uuid,
    name: m.user.name,
    position: m.position,
    avatar:
      m.user.profile_image ||
      AVATARS[Math.floor(Math.random() * AVATARS.length)],
    email: m.user.email,
    phone: m.user.phone,
    github: m.user.github_url || '',
  })),
  tickets: [],
  logs: [],
  notes: [],
  links: [],
  userStatuses: Object.fromEntries(
    team.members.map((m) => [
      m.user.name,
      { label: m.status || '활동 중', color: 'bg-green-500' },
    ]),
  ),
});

/**
 * 특정 팀의 데이터를 최신 상태로 갈아끼워주는 헬퍼 함수
 * @param prev 기존 로컬 팀 리스트
 * @param targetId 수정하려는 팀 ID(activeTeamId)
 * @param updatedData 수정이 반영된 새로운 팀 객체
 */

const getUpdatedTeams = (
  prev: Team[],
  targetId: string,
  updatedTeam: Team,
): Team[] => {
  const filtered = prev.filter((t) => String(t.id) !== String(targetId));
  return [...filtered, updatedTeam];
};

// 상태 관리 - 팀 리스트 및 참여중인 팀 ID
export const useTeams = (currentUser: CurrentUser | null) => {
  const [localTeams, setTeams] = useState<Team[]>([INITIAL_TEAM])

  // 새로고침 시, 로컬스토리지에 저장된 팀 ID를 가져오기
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);

  // 인증 대기 중인 팀 ID (비밀번호 입력 후 인증이 완료되면 activeTeamId로 이동)
  const [pendingTeamId, setPendingTeamId] = useState<string | null>(null);

  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  const { data: detailData } = useQuery({
    queryKey: ['ticketDetail', selectedTicketId],
    queryFn: () => getTicketDetailApi(selectedTicketId!),
    enabled: !!selectedTicketId,
  });

  // GET /teams API 호출로 팀 목록 가져오기
  const { data: teamListData } = useQuery({
    queryKey: ['teams'],
    queryFn: getTeamsApi,
    enabled: !!currentUser,
    staleTime: 0,
    gcTime: 0,
  });

  // 활성화된 팀의 테스크 목록 조회
  const { data: ticketData } = useQuery({
    queryKey: ['tickets', activeTeamId],
    queryFn: () => getTicketsApi(Number(activeTeamId)),
    enabled: !!activeTeamId,
  });

  // 상세 데이터가 오면 해당 티켓 업데이트
  useEffect(() => {
    if (detailData?.success && activeTeamId) {
      const d = detailData.data;
      setTeams(prev => prev.map(team => {
        if (String(team.id) === String(activeTeamId)) {
          return {
            ...team,
            tickets: team.tickets.map(t => 
              t.id === d.id ? {
                ...t,
                content: d.content,
                // 서버 응답의 comments 구조를 UI 규격에 맞게 매핑
                comments: d.comments.map((c: any) => ({
                  task_number: d.task_number,
                  user: c.user.name,
                  text: c.content,
                  time: new Date(c.created_at).toLocaleTimeString()
                })),
                // 상세 데이터에서 온 실제 이름들로 교체
                requester: d.requester.name,
                worker: d.worker.name
              } : t
            )
          };
        }
        return team;
      }));
    }
  }, [detailData, activeTeamId]);
  
  // API 팀 목록과 로컬 팀 목록 합치기
  // 서버에서 데이터를 받아와서 localTeams 동기화
  useEffect(() => {
    if (teamListData?.data) {
      const apiTeams = teamListData.data.map(convertTeam);
      setTeams(prev => {
        // 기존 INITIAL_TEAM이나 로컬 전용 팀을 유지하면서 서버 팀 정보로 교체/합치기
        const otherTeams = prev.filter(p => !apiTeams.some(a => a.id === p.id));
        return [...apiTeams, ...otherTeams];
      });
    }
  }, [teamListData]);

  const teams = localTeams;

  // 선택된 팀의 티켓 데이터를 localTeams에 추가
  useEffect(() => {
    if (ticketData?.success && activeTeamId) {
      // 현재 활성화된 팀 '멤버 리스트' 가져오기
      const currentTeam = localTeams.find(t => String(t.id) === String(activeTeamId));
      if (!currentTeam) return;

      const currentMembers = currentTeam?.members || [];
      const serverTasks = ticketData.data.tasks.map((task: any) => {
        // worker_id(UUID)와 일치하는 담당자 찾기
        const matchedMember = currentMembers.find(m => String(m.uuid) === String(task.worker_id));

        // 요청자 ID로 요청자 찾기
        const requesterMember = currentMembers.find(m => String(m.uuid) === String(task.requester_id));
        
        return {
          id: task.id,
          task_number: task.task_number,
          title: task.title,
          content: task.content,
          status: task.status || 'Todo',
          requester: requesterMember ? requesterMember.name : "요청자", 
          // 찾은 맴버가 있다면 이름 추가, 없으면 id 및 '담당자'로 표시
          worker: matchedMember ? matchedMember.name : "담당자",
          createdAt: task.created_at?.split('T')[0] || "",
          comments: [] 
        };
      });

      setTeams(prev => {
        const targetTeam = prev.find(t => String(t.id) === String(activeTeamId));
        const isSame = JSON.stringify(targetTeam?.tickets) === JSON.stringify(serverTasks);
      
        if (isSame) return prev; 

        return prev.map(team => 
          String(team.id) === String(activeTeamId) ? { ...team, tickets: serverTasks } : team
        );
      });
    }
  }, [ticketData, activeTeamId, localTeams]);

  // 현재 활성화된 팀 객체를 실시간으로 찾아 유지
  const activeTeam = useMemo(() => {
    if (!activeTeamId) return null;
    // localTeams에서 찾되, 만약 아직 로드 전이라면 빈 객체라도 반환하여 팅기지 않게 설정
    const found = localTeams.find((t) => String(t.id) === String(activeTeamId));
    return found || null;
  }, [localTeams, activeTeamId]);

  // 현재 유저가 참여 중인 팀 목록
  const joinedTeams = useMemo(() => {
    if (!currentUser) return [];
    return teams.filter((team) =>
      team.members.some((member) => member.name === currentUser.name),
    );
  }, [teams, currentUser]);

  // 현재 유저가 아직 참여하지 않은 팀 목록
  const availableTeams = useMemo(() => {
    if (!currentUser) return teams;
    return teams.filter(
      (team) =>
        !team.members.some((member) => member.name === currentUser.name),
    );
  }, [teams, currentUser]);

  // 팀 이름 중복 체크
  const isTeamNameTaken = (teamName: string) => {
    return teams.some(
      (team) =>
        team.name.trim().toLowerCase() === teamName.trim().toLowerCase(),
    );
  };

  // 6자리 숫자 비밀번호 체크
  const isValidTeamPassword = (password: string) => {
    return /^\d{6}$/.test(password);
  };

  const handleDeleteTicketApi = async (ticketId: number) => {
  try {
    const response = await deleteTicketApi(ticketId);
    if (response.success) {
      setTeams((prevTeams) =>
        prevTeams.map((team) => {
          if (String(team.id) === String(activeTeamId)) {
            return {
              ...team,
              tickets: team.tickets.filter((t) => t.id !== ticketId),
            };
          }
          return team;
        })
      );
      return { ok: true };
    }
    return { ok: false, message: "삭제에 실패했습니다." };
  } catch (error) {
    console.error("삭제 중 오류 발생:", error);
    return { ok: false, message: "서버 통신 오류가 발생했습니다." };
  }
};

  /**
   * [핵심 함수] addLog: 활동 로그 생성
   * @param ticketId 관련 티켓 번호 (시스템 로그일 경우 0)
   * @param userName 작업 수행자 이름
   * @param action 발생한 동작 설명
   * @param type 로그의 성격 (default: 일반, info: 정보/변경, success: 완료, error: 반려/에러)
   */
  const addLog = (
    ticketId: number,
    userName: string,
    action: string,
    type: 'default' | 'info' | 'success' | 'error' = 'default',
    overrideTeamId?: string
  ) => {
    // activeTeamId가 없는데 overrideTeamId도 없다면 그때만 리턴
    const targetTeamId = overrideTeamId || activeTeamId;
    if (!targetTeamId) return;

    const time = formatLogTime();

    setTeams((prev) =>
      prev.map((t) =>
        t.id === targetTeamId
          ? {
              ...t,
              logs: [
                {
                  id: Date.now(),
                  ticketId,
                  user: userName,
                  action,
                  time,
                  type,
                },
                ...t.logs,
              ].slice(0, 20),
            }
          : t,
      ),
    );
  };

  /**
   * [기능] createTeam: 새 팀 생성
   */
  const createTeam = (teamName: string, teamPassword: string) => {
    if (!currentUser) {
      return { ok: false, message: '유저 정보가 없습니다.' };
    }

    const trimmedName = teamName.trim();
    const trimmedPassword = teamPassword.trim();

    if (trimmedName.length < 2 || trimmedName.length > 30) {
      return {
        ok: false,
        message: '팀 이름은 2자 이상 30자 이하로 입력해주세요.',
      };
    }

    if (!trimmedPassword) {
      return { ok: false, message: '비밀번호를 입력해주세요.' };
    }

    if (!isValidTeamPassword(trimmedPassword)) {
      return { ok: false, message: '비밀번호는 6자리 숫자로 입력해주세요.' };
    }

    if (isTeamNameTaken(trimmedName)) {
      return { ok: false, message: '이미 존재하는 팀 이름입니다.' };
    }

    const newTeam: Team = {
      id: `team_${Date.now()}`,
      name: trimmedName,
      password: trimmedPassword,
      members: [{ ...currentUser }],
      tickets: [],
      logs: [
        {
          id: Date.now(),
          ticketId: 0,
          user: currentUser.name,
          action: '새 프로젝트 개설',
          time: '현재',
          type: 'info',
        },
      ],
      notes: [],
      links: [],
      userStatuses: {
        [currentUser.name]: { label: '활동 중', color: 'bg-green-500' },
      },
    };

    setTeams((prev) => [...prev, newTeam]);
    setActiveTeamId(newTeam.id);

    return {
      ok: true,
      message: '팀이 생성되었습니다.',
      team: newTeam,
    };
  };

  /**
   * [기능] joinTeam: 팀 가입 처리
   */
  const joinTeam = (teamId: string, password: string) => {
    if (!currentUser) {
      return { ok: false, message: '유저 정보가 없습니다.' };
    }

    const trimmedPassword = password.trim();
    const targetTeam = teams.find((team) => team.id === teamId);

    if (!targetTeam) {
      return { ok: false, message: '팀을 찾을 수 없습니다.' };
    }

    if (!isValidTeamPassword(trimmedPassword)) {
      return { ok: false, message: '비밀번호는 6자리 숫자로 입력해주세요.' };
    }

    if (targetTeam.password !== trimmedPassword) {
      return { ok: false, message: '비밀번호가 일치하지 않습니다.' };
    }

    const isAlreadyMember = targetTeam.members.some(
      (member) => member.name === currentUser.name,
    );

    if (!isAlreadyMember) {
      setTeams(prev => 
        prev.map(team => 
        String(team.id) === String(teamId)
            ? {
                ...team,
                members: [...team.members, currentUser],
                userStatuses: {
                  ...team.userStatuses,
                  [currentUser.name]: {
                    label: '방금 입장',
                    color: 'bg-green-500',
                  },
                },
              }
            : team,
        ),
      );
    }

    // 여기서 setActiveTeamId를 하지 않고, 성공 여부만 반환
    return {
      ok: true,
      message: '팀 입장 완료',
    };
  };

  /**
   * [기능] updateTicketStatus: 티켓의 진행 상태 변경
   */
  const updateTicketStatus = (
    id: number,
    newStatus: string,
    isReject = false,
  ) => {
    if (!activeTeamId || !currentUser) return;

    setTeams((prev) =>
      prev.map((t) =>
        t.id === activeTeamId
          ? {
              ...t,
              tickets: t.tickets.map((tk) =>
                tk.id === id ? { ...tk, status: newStatus } : tk,
              ),
            }
          : t,
      ),
    );

    let logType: 'info' | 'success' | 'error' = 'info';
    if (isReject) logType = 'error';
    else if (newStatus === 'done') logType = 'success';

    addLog(
      id,
      currentUser.name,
      isReject ? '반려 및 재요청' : `상태 변경: ${newStatus}`,
      logType,
    );
  };

  /**
   * [기능] handleCreateTicket: 새로운 업무 요청(티켓) 발행
   */
  const handleCreateTicket = (
    title: string,
    content: string,
    worker: string,
  ) => {
    if (!currentUser || !activeTeamId) {
      console.error('생성 실패: 유저 정보나 활성화된 팀 ID가 없습니다.');
      console.log('체크:', { currentUser, activeTeamId });
      return;
    }

    const newTicket: Ticket = {
      id: Date.now(),
      task_number: 0,
      title,
      content,
      requester: currentUser.name,
      worker,
      status: 'Todo',
      createdAt: new Date()
        .toLocaleString('ko-KR', { hour12: false })
        .slice(0, -3),
      comments: [],
    };

    setTeams((prevTeams) =>
      prevTeams.map((team) =>
        team.id === activeTeamId
          ? { ...team, tickets: [newTicket, ...team.tickets] }
          : team,
      ),
    );

    addLog(newTicket.id, currentUser.name, `새 업무 발행: ${title}`, 'default');
  };

  /**
   * [기능] handleAddComment: 티켓 내 댓글 추가
   */
  const handleAddComment = (ticketId: number, text: string) => {
    if (!text || !currentUser || !activeTeamId) return;

    setTeams((prev) =>
      prev.map((t) =>
        t.id === activeTeamId
          ? {
              ...t,
              tickets: t.tickets.map((tk) =>
                tk.id === ticketId
                  ? {
                      ...tk,
                      comments: [
                        ...tk.comments,
                        {
                          id: Date.now(),
                          user: currentUser.name,
                          text,
                          time: new Date().toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          }),
                        },
                      ],
                    }
                  : tk,
              ),
            }
          : t,
      ),
    );

    addLog(ticketId, currentUser.name, '댓글 작성', 'info');
  };

  /**
   * [기능] leaveTeam: 현재 유저를 팀 멤버 목록에서 제거
   */
  const leaveTeam = (teamId: string) => {
    if (!currentUser) return;

    setTeams((prev) =>
      prev.map((team) =>
        team.id === teamId
          ? {
              ...team,
              members: team.members.filter(
                (member) => member.name !== currentUser.name,
              ),
              userStatuses: Object.fromEntries(
                Object.entries(team.userStatuses).filter(
                  ([userName]) => userName !== currentUser.name,
                ),
              ),
            }
          : team,
      ),
    );

    if (activeTeamId === teamId) {
      setActiveTeamId(null);
    }
  };

  // 내 포지션 수정
  const handleEditPosition = (newPosition: string) => {
    if (!currentUser || !activeTeamId || !activeTeam) return;

    // 새로운 정보가 반영된 팀 객체 생성
    const updatedActiveTeam = {
      ...activeTeam,
      members: activeTeam.members.map((member) =>
        member.email === currentUser.email
          ? { ...member, position: newPosition }
          : member,
      ),
    };
    setTeams((prev) => getUpdatedTeams(prev, activeTeamId, updatedActiveTeam));
  };

  // 외부 컴포넌트에서 사용할 데이터와 함수 반환
  return {
    currentUser,
    teams,
    setTeams,
    activeTeamId,
    setActiveTeamId,
    activeTeam,
    joinedTeams,
    availableTeams,
    isTeamNameTaken,
    isValidTeamPassword,
    createTeam,
    joinTeam,
    addLog,
    updateTicketStatus,
    handleCreateTicket,
    handleAddComment,
    leaveTeam,
    setSelectedTicketId,
    selectedTicketId,
    handleDeleteTicketApi,
    handleEditPosition,
    pendingTeamId,
    setPendingTeamId
  };
};

