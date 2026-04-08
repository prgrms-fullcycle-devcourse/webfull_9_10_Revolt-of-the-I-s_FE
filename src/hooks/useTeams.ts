/**
 * useTeams 커스텀 훅
 * @description 팀 데이터(Team), 티켓(Ticket), 활동 로그(Log)의 상태 관리 및 비즈니스 로직을 총괄합니다.
 * @param currentUser 현재 접속한 유저 정보 (로그 기록 및 권한 확인용)
 */

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Team,
  Ticket,
  CurrentUser,
  TeamFromApi,
  TeamLink,
  TeamDocument,
} from '../types';
import { INITIAL_TEAM, AVATARS } from '../utils/constants';
import { getTeamsApi } from '../api/team';
import {
  deleteTicketApi,
  getTicketDetailApi,
  getTicketsApi,
  acceptTicketApi,
  submitTicketApi,
  confirmTicketApi,
  rejectTicketApi,
} from '../api/tickets';

import {
  deleteDocApi,
  deleteQuickLinkApi,
  getDocApi,
  getQuickLinksApi,
} from '../api/archive';
import { updateMyStatusApi } from '../api/status';
import { pusher } from "../utils/pusher";
import { getTeamLogsApi } from "../api/log";
import { createCommentApi, DeleteCommentApi, updateCommentApi } from "../api/comments";

// 상태별 색 매핑
const STATUS_COLORS: Record<string, string> = {
  '업무 중': 'bg-green-500',
  '회의 중': 'bg-blue-500',
  '쉬는 중': 'bg-orange-500',
  '자리 비움': 'bg-slate-400',
};

// 로그의 액션 타입에 따라 UI 색상을 결정하는 헬퍼 함수
const getLogDisplayType = (actionType: string, message: string): 'default' | 'info' | 'success' | 'error' => {
  if (actionType === 'CREATE_TASK' || actionType === 'ACCEPT_TASK') return 'info';
  if (actionType === 'APPROVE_TASK' || actionType === 'STATUS_CHANGE') return 'success';
  if (actionType === 'REJECT_TASK' || actionType === 'CANCEL_TASK') return 'error';
  
  // 타입이 명확하지 않을 때 메시지 내용으로 한 번 더 체크
  if (message.includes('반려') || message.includes('취소')) return 'error';
  if (message.includes('상태') || message.includes('승인')) return 'success';
  
  return 'default';
};

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
    team.members.map((m) => {
      const statusLabel = m.status || '업무 중'; // 기본값 설정
      return [
        m.user.name,
        { 
          label: statusLabel,
          color: STATUS_COLORS[statusLabel] || 'bg-green-500' 
        },
      ];
    }),
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
export const useTeams = (
  currentUser: CurrentUser | null,
  selectedTicketId: number | null,
) => {
  const [localTeams, setTeams] = useState<Team[]>([INITIAL_TEAM]);

  // 새로고침 시, 로컬스토리지에 저장된 팀 ID를 가져오기
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);

  // 인증 대기 중인 팀 ID (비밀번호 입력 후 인증이 완료되면 activeTeamId로 이동)
  const [pendingTeamId, setPendingTeamId] = useState<string | null>(null);

  const { data: detailData } = useQuery({
    queryKey: ['ticketDetail', selectedTicketId],
    queryFn: () => getTicketDetailApi(selectedTicketId!),
    enabled: !!selectedTicketId,
    staleTime: 0
  });

  // GET /teams API 호출로 팀 목록 가져오기
  const { data: teamListData } = useQuery({
    queryKey: ['teams'],
    queryFn: getTeamsApi,
    enabled: !!currentUser,
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
      setTeams((prev) =>
        prev.map((team) => {
          if (String(team.id) === String(activeTeamId)) {
            return {
              ...team,
              tickets: team.tickets.map((t) =>
                t.id === d.id
                  ? {
                      ...t,
                      content: d.content,
                      // 서버 응답의 comments 구조를 UI 규격에 맞게 매핑
                      comments: d.comments.map((c: any) => ({
                        task_number: d.task_number,
                        user: c.user.name,
                        text: c.content,
                        time: new Date(c.created_at).toLocaleTimeString(),
                      })),
                      // 상세 데이터에서 온 실제 이름들로 교체
                      requester: d.requester.name,
                      worker: d.worker.name,
                    }
                  : t,
              ),
            };
          }
          return team;
        }),
      );
    }
  }, [detailData, activeTeamId]);

  // 내 상태 업데이트 함수
  const updateMyStatus = async (newStatus: string) => {
    if (!activeTeamId || !currentUser) return;

    try {
      const response = await updateMyStatusApi(Number(activeTeamId), newStatus);
      
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['teams'] });
      }
    } catch (error) {
      console.error("내 상태 변경 실패:", error);
      alert("상태 업데이트에 실패했습니다.");
    }
  };

  const queryClient = useQueryClient();

  // Pusher 실시간 리스너
  useEffect(() => {
    if (!activeTeamId || !currentUser) return;

    const teamChannel = pusher.subscribe(`team-${activeTeamId}`);
    const userChannel = pusher.subscribe(`user-${currentUser.uuid}`);

    // pusher 리스너 - 내 상태 업데이트
    teamChannel.bind('status-updated', (data: { email: string; status: string; name: string }) => {
    console.log("👤 [실시간] 팀원 상태 변경 수신:", data);

    // 서버의 팀 목록 데이터를 무효화
    // => teamListData가 새로 호출되면서 바뀐 status가 들어옴
    queryClient.invalidateQueries({ queryKey: ['teams'] });

    // 로그 목록도 함께 갱신
    queryClient.invalidateQueries({ queryKey: ['logs', activeTeamId] });
  });

    // pusher 리스너 - 테스크 상태 업데이트
    teamChannel.bind('task-status-updated', (data: { taskId: number; status: string }) => {
    console.log("📍 [실시간] 테스크 상태 변경 감지!", data);
      queryClient.invalidateQueries({ queryKey: ['tickets', activeTeamId] });
    });

    // pusher 리스너 - 개인별 테스크 할당 알림
    userChannel.bind('new-task-requested', (data: any) => {
    console.log("🔔 나에게 온 새 업무 신호 수신:", data);
    
    // 나에게 할당된 요청 알림 - 추후에 토스트 알림으로 변경할 예정
    alert(data.message);

    queryClient.invalidateQueries({ queryKey: ['tickets', activeTeamId] });
    queryClient.invalidateQueries({ queryKey: ['logs', activeTeamId] });
  });

  return () => {
    pusher.unsubscribe(`team-${activeTeamId}`);
    pusher.unsubscribe(`user-${currentUser.uuid}`);
    teamChannel.unbind_all();
    userChannel.unbind_all();
  };
}, [activeTeamId, currentUser, queryClient]);

useEffect(() => {
  // 특정 테스크 모달이 열려 있을 때만 리스너를 가동합니다.
  if (!selectedTicketId) return;

  console.log(`[Pusher] #${selectedTicketId} 테스크 채널 구독 시도...`);
  const taskChannel = pusher.subscribe(`task-${selectedTicketId}`);

  taskChannel.bind('new-comment', (data: any) => {
    console.log("💬 [Pusher] 실시간 댓글 이벤트 발생!", data);
    // 💡 여기서 invalidateQueries를 호출해야 위 useMemo가 다시 작동합니다.
    queryClient.invalidateQueries({ queryKey: ['ticketDetail', selectedTicketId] });
  });

  return () => {
    pusher.unsubscribe(`task-${selectedTicketId}`);
    taskChannel.unbind_all();
  };
}, [selectedTicketId, queryClient]);

  // 댓글 수정 핸들러
  const onUpdateComment = async (commentId: number, text: string) => {
    /* 수정 로직 */
    const response = await updateCommentApi(commentId, text);
    if (response.success) {
      queryClient.invalidateQueries({ queryKey: ['ticketDetail', selectedTicketId] });
    }
  };

  const onDeleteComment = async (commentId: number) => {
    /* 삭제 로직 */
    const response = await DeleteCommentApi(commentId);
    if (response.success) {
      queryClient.invalidateQueries({ queryKey: ['ticketDetail', selectedTicketId] });
    }
  };

  // API 팀 목록과 로컬 팀 목록 합치기
  // 서버에서 데이터를 받아와서 localTeams 동기화
  useEffect(() => {
    if (teamListData?.data) {
      const apiTeams = teamListData.data.map(convertTeam);

      setTeams((prev) => {
        // 기존 INITIAL_TEAM이나 로컬 전용 팀을 유지하면서 서버 팀 정보로 교체/합치기
        const otherTeams = prev.filter(
          (p) => !apiTeams.some((a) => a.id === p.id),
        );

        return [...apiTeams, ...otherTeams];
      });
    }
  }, [teamListData]);

  const teams = localTeams;

  /**
   * 팀 활동 로그 조회
   */
  // 현재 어떤 로그 탭을 보고 있는지 상태 추가
  const [activeLogTab, setActiveLogTab] = useState<'all' | 'mine'>('all');

  // 로그 데이터 조회 (React Query)
  const { data: logData } = useQuery({
    queryKey: ['logs', activeTeamId, activeLogTab], 
    queryFn: () => getTeamLogsApi(
      Number(activeTeamId), 
      activeLogTab === 'mine' // true 또는 false 전달
    ),
    enabled: !!activeTeamId,
  });

  // 현재 활성화된 팀 객체를 실시간으로 찾아 유지
  const activeTeam = useMemo(() => {
    if (!teamListData?.data || !activeTeamId) return null;

    // 1. 서버 팀 목록에서 현재 팀 찾기
    const rawTeam = teamListData.data.find((t: any) => String(t.id) === String(activeTeamId));
    if (!rawTeam) return null;

    // 2. 기본 팀 정보 변환
    const baseTeam = convertTeam(rawTeam);

    // 3. 서버에서 온 티켓 데이터가 있다면 합치기
    if (ticketData?.success && ticketData.data.tasks) {
      baseTeam.tickets = ticketData.data.tasks.map((task: any) => {
        // Number로 변환 후 비교
      const isSelected = selectedTicketId !== null && Number(task.id) === Number(selectedTicketId);

      const detailIdMatch = detailData?.success && String(detailData.data.id) === String(task.id);

      // 댓글 매핑
      let serverComments = [];
      if (isSelected && detailIdMatch) {
        serverComments = detailData.data.comments.map((c: any) => ({
          id: c.id,
          user: c.user?.name || '알 수 없음',
          text: c.content,
          time: new Date(c.created_at).toLocaleTimeString('ko-KR', { hour12: false }),
        }));
      } else {
        serverComments = task.comments || [];
      }

      return {
        id: task.id,
        task_number: task.task_number,
        title: task.title,
        content: task.content,
        status: task.status || 'Todo',
        requester: baseTeam.members.find(m => String(m.uuid) === String(task.requester_id))?.name || '요청자',
        worker: baseTeam.members.find(m => String(m.uuid) === String(task.worker_id))?.name || '담당자',
        worker_id: String(task.worker_id || ""),
        createdAt: task.created_at?.split('T')[0] || '',
        comments: serverComments,
      };
    });
  }

    // 4. 서버에서 온 로그 데이터가 있다면 합치기
    if (logData?.success && Array.isArray(logData.data)) {
      baseTeam.logs = logData.data.map((log: any) => ({
        id: log.id,
        ticketId: log.task_id,
        user: log.user.name,
        action: log.message,
        time: new Date(log.created_at).toLocaleTimeString('ko-KR', { hour12: false }),
        type: getLogDisplayType(log.action_type, log.message), // 💡 여기서 함수 사용!
      }));
    }

    return baseTeam;
  }, [
    activeTeamId, 
    teamListData, 
    ticketData, 
    logData, 
    detailData?.data,
    selectedTicketId]);

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
    console.log(`[삭제 시도] 티켓:${ticketId}, 활성팀:${activeTeamId}`);

  try {
    const response = await deleteTicketApi(ticketId);

    if (response.success) {
      await queryClient.invalidateQueries({ queryKey: ['tickets', activeTeamId] });
      
      return { ok: true };
    }
    return { ok: false, message: response.error || "삭제 권한이 없습니다." };
  } catch (error: any) {
    return { ok: false, message: "서버에서 권한을 거부했습니다." };
  }
};

  // addLog 함수
  const addLog = (_ticketId: number, userName: string, action: string, _type: any = 'default') => {
    console.log(`[시스템] 서버 로그 생성 대기: ${userName} - ${action}`);
    // 직접 setTeams를 하지 않고, 서버의 Pusher 응답 출력
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
      setTeams((prev) =>
        prev.map((team) => {
          if (String(team.id) === String(teamId)) {
            // 기존 멤버 중 본인 uuid가 있는지 확인
            const exists = team.members.some(m => m.uuid === currentUser.uuid);
            
            return {
              ...team,
              members: exists ? team.members : [...team.members, currentUser],
              userStatuses: {
                ...team.userStatuses,
                [currentUser.name]: {
                  label: '방금 입장',
                  color: 'bg-green-500',
                },
              },
            };
          }
          return team;
        })
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
  const updateTicketStatus = async (
    taskId: number,
    actionType: 'accept' | 'submit' | 'confirm' | 'reject',
  ) => {
    if (!activeTeamId || !currentUser) return;

    const apiMap = {
      accept: acceptTicketApi,
      submit: submitTicketApi,
      confirm: confirmTicketApi,
      reject: rejectTicketApi,
    };

    try {
      // 선택된 액션에 맞는 API 호출
      const response = await apiMap[actionType](taskId);

      if (response.data.success) {
        // 쿼리 무효화 (서버에서 최신 리스트를 가져와서 칸반보드 위치 이동)
        await queryClient.invalidateQueries({ queryKey: ['tickets', activeTeamId] });
        await queryClient.invalidateQueries({ queryKey: ['logs', activeTeamId] });
        
        addLog(taskId, currentUser.name, 'info');

        return { ok: true };
      }
    } catch (error) {
      console.error(`${actionType} 처리 중 오류:`, error);
      alert("해당 권한이 없습니다.");
      return { ok: false };
    }
  };

  /**
   * [기능] handleCreateTicket: 새로운 업무 요청(티켓) 발행
   */
  const handleCreateTicket = (
    title: string,
    content: string,
    worker_id: string,
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
      worker: "담당자",
      worker_id: String(worker_id),
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
  };

  /**
   * [기능] handleAddComment: 티켓 내 댓글 추가
   */
  const handleAddComment = async (ticketId: number, text: string) => {
    if (!text || !currentUser || !activeTeamId) return false;

  console.log(`🚀 [댓글전송] ${ticketId}번 테스크에 댓글 작성 시도: "${text}"`);

  try {
    const response = await createCommentApi(ticketId, text); 

    if (response.success) {
      console.log("✅ [서버응답] 댓글 저장 완료. 데이터를 새로고침합니다.");
      
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ticketDetail', ticketId] }),
        queryClient.invalidateQueries({ queryKey: ['tickets', activeTeamId] }),
        queryClient.invalidateQueries({ queryKey: ['logs', activeTeamId] })
      ]);
      
      return true;
    }
    return false;
  } catch (error) {
    console.error("❌ [에러] 댓글 작성 실패:", error);
    return false;
  }
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
    try {
      if (!currentUser || !activeTeamId || !activeTeam) return;

      // 새로운 정보가 반영된 팀 객체 생성
      const updatedActiveTeam = {
        ...activeTeam,
        members: activeTeam.members.map((member) =>
          member.uuid === currentUser.uuid
            ? { ...member, position: newPosition }
            : member,
        ),
      };
      setTeams((prev) =>
        getUpdatedTeams(prev, activeTeamId, updatedActiveTeam),
      );
    } catch (error) {
      console.log('포지션 수정 실패 :', error);
      throw error;
    }
  };

  // 활성화된 팀의 퀵 링크 목록 조회
  const { data: linkData } = useQuery({
    queryKey: ['linkData', activeTeamId],
    queryFn: () => getQuickLinksApi(Number(activeTeamId)),
    enabled: !!activeTeamId && !!currentUser,
  });
  // 활성화된 팀의 문서 목록 조회
  const { data: docData } = useQuery({
    queryKey: ['docData', activeTeamId],
    queryFn: () => getDocApi(Number(activeTeamId)),
    enabled: !!activeTeamId && !!currentUser,
  });

  // 아카이브 데이터가 오면 activeTeam의 links에 추가
  useEffect(() => {
    if (activeTeamId && (linkData || docData)) {
      const rawLinks = linkData?.data || [];
      const rawDocs = docData?.data || [];
      const combinedData = [...rawLinks, ...rawDocs];

      combinedData.sort((a, b) =>
        (b.created_at || '').localeCompare(a.created_at || ''),
      );

      const serverLinks = combinedData.map((link: TeamLink) => ({
        id: link.id,
        type: link.type,
        title: link.title,
        content: link.content,
        createdAt: link.createdAt,
      }));

      setTeams((prev) => {
        const targetTeam = prev.find(
          (t) => String(t.id) === String(activeTeamId),
        );
        const isSame =
          JSON.stringify(targetTeam?.links) === JSON.stringify(serverLinks);
        if (isSame) return prev;

        return prev.map((team) =>
          String(team.id) === String(activeTeamId)
            ? { ...team, links: serverLinks }
            : team,
        );
      });
    }
  }, [linkData, docData, activeTeamId]);

  // 아카이브 > 퀵 링크 생성
  const handleCreateQuickLink = (title: string, content: string) => {
    try {
      if (!currentUser || !activeTeamId || !activeTeam) return;
      if (!title || !content) return;
      console.log('새 링크 생성 시도:', title, content);

      const newLink: TeamLink = {
        id: Date.now(),
        type: 'LINK',
        title: title,
        content: content,
        createdAt: new Date()
          .toLocaleString('ko-KR', { hour12: false })
          .slice(0, -3),
      };

      const updatedActiveTeam = {
        ...activeTeam,
        links: [newLink, ...activeTeam.links],
      };

      setTeams((prev) =>
        getUpdatedTeams(prev, activeTeamId, updatedActiveTeam),
      );
      queryClient.invalidateQueries({
        queryKey: ['archiveData', activeTeamId],
      });
    } catch (error) {
      console.log('링크 생성 실패 :', error);
      throw error;
    }
  };

  // 아카이브 > 퀵 링크 삭제
  const handleDeleteQuickLink = async (linkId: number) => {
    try {
      if (!currentUser || !activeTeamId || !activeTeam) return;
      if (linkId === 0) return;

      await deleteQuickLinkApi(linkId);

      const updatedActiveTeam = {
        ...activeTeam,
        links: activeTeam.links.filter((link) => link.id !== linkId),
      };
      setTeams((prev) =>
        getUpdatedTeams(prev, activeTeamId, updatedActiveTeam),
      );
      queryClient.invalidateQueries({
        queryKey: ['linkData', activeTeamId],
      });
    } catch (error: any) {
      console.log('삭제 실패 :', error);
      throw error;
    }
  };

  // 아카이브 > 문서 생성
  const handleCreateDoc = (title: string, file: File | null) => {
    try {
      if (!currentUser || !activeTeamId || !activeTeam) return;
      if (!title || !file) return;

      const newDoc: TeamDocument = {
        id: Date.now(),
        type: 'PDF',
        title: title,
        content: URL.createObjectURL(file),
        createdAt: new Date()
          .toLocaleString('ko-KR', { hour12: false })
          .slice(0, -3),
      };

      const updatedActiveTeam = {
        ...activeTeam,
        links: [newDoc, ...activeTeam.links],
      };

      setTeams((prev) =>
        getUpdatedTeams(prev, activeTeamId, updatedActiveTeam),
      );
      queryClient.invalidateQueries({
        queryKey: ['docData', activeTeamId],
      });
    } catch (error) {
      console.log('문서 생성 실패 :', error);
      throw error;
    }
  };

  // 아카이브 > 문서 삭제 (링크 삭제와 동일하게 처리)
  // handleDeleteDoc 함수는 handleDeleteQuickLink와 동일한 로직으로 구현이나 api가 달라 분리
  const handleDeleteDoc = async (docId: number) => {
    try {
      if (!currentUser || !activeTeamId || !activeTeam) return;
      if (docId === 0) return;

      await deleteDocApi(docId);

      const updatedActiveTeam = {
        ...activeTeam,
        links: activeTeam.links.filter((link) => link.id !== docId),
      };

      setTeams((prev) =>
        getUpdatedTeams(prev, activeTeamId, updatedActiveTeam),
      );
      queryClient.invalidateQueries({
        queryKey: ['archiveData', activeTeamId],
      });
    } catch (error: any) {
      console.log('삭제 실패 :', error);
      throw error;
    }
  };

  // 외부 컴포넌트에서 사용할 데이터와 함수 반환
  return {
    currentUser,
    teams,
    setTeams,
    activeTeamId,
    setActiveTeamId,
    updateMyStatus,
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
    onUpdateComment,
    onDeleteComment,
    leaveTeam,
    activeLogTab,
    setActiveLogTab,
    handleDeleteTicketApi,
    handleEditPosition,
    pendingTeamId,
    setPendingTeamId,
    handleCreateQuickLink,
    handleDeleteQuickLink,
    handleCreateDoc,
    handleDeleteDoc,
  };
};
