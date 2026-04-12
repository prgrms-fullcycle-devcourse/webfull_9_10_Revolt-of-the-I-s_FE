/**
 * useTeams 커스텀 훅
 * @description 팀 데이터(Team), 티켓(Ticket), 활동 로그(Log)의 상태 관리 및 비즈니스 로직을 총괄합니다.
 * @param currentUser 현재 접속한 유저 정보 (로그 기록 및 권한 확인용)
 */

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type {
  Team,
  Ticket,
  CurrentUser,
  TeamFromApi,
  TeamArchiveData,
  PusherCommentData,
  TaskBaseFromApi,
  TaskComment,
  TaskCommentFromApi,
  OnlineUserFromApi,
  GetOnlineUsersResponse,
} from '../types';
import { INITIAL_TEAM, AVATARS, USER_ACTIVITIES } from '../utils/constants';
import { getTeamsApi, joinTeamApi, leaveTeamApi } from '../api/team';
import {
  deleteTicketApi,
  getTicketDetailApi,
  getTicketsApi,
  acceptTicketApi,
  submitTicketApi,
  confirmTicketApi,
  rejectTicketApi,
  createTicketApi,
  UpdateTicketApi,
} from '../api/tickets';

import {
  createNoteApi,
  deleteDocApi,
  deleteNoteApi,
  deleteQuickLinkApi,
  editNoteApi,
  getDocApi,
  getNotesApi,
  getQuickLinksApi,
  type NoteRequest,
} from '../api/archive';
import { updateMyStatusApi } from '../api/status';
import { pusher } from '../utils/pusher';
import { getTeamLogsApi } from '../api/log';
import {
  createCommentApi,
  DeleteCommentApi,
  updateCommentApi,
} from '../api/comments';
import { getOnlineUsersApi } from "../api/member";
import toast from "react-hot-toast";

// 로그의 액션 타입에 따라 UI 색상을 결정하는 헬퍼 함수
const getLogDisplayType = (
  actionType: string
): 'default' | 'info' | 'success' | 'error' => {
  if (actionType === 'CREATE') return 'info'; 
  if (actionType === 'MOVE') return 'success';
  if (actionType === 'DELETE') return 'error';

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
      const statusLabel = m.status || '업무 중';
      const matched = USER_ACTIVITIES.find(a => a.label === statusLabel);
      return [

        m.user.uuid,
        { 
          label: statusLabel,
          color: matched?.color || 'bg-green-500' 
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

// 상태 관리 - 팀 리스트 및 참여중인 팀 ID
export const useTeams = (
  currentUser: CurrentUser | null,
  selectedTicketId: number | null,
  setSelectedTicketId: (id: number | null) => void
) => {
  // 새로고침 시, 로컬스토리지에 저장된 팀 ID를 가져오기
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);

  // 인증 대기 중인 팀 ID (비밀번호 입력 후 인증이 완료되면 activeTeamId로 이동)
  const [pendingTeamId, setPendingTeamId] = useState<string | null>(null);

  // 어떤 로그 탭을 보고 있는지 상태 추가
  const [activeLogTab, setActiveLogTab] = useState<'all' | 'mine'>('all');

  // GET /teams API 호출로 팀 목록 가져오기
  const { data: teamListData } = useQuery({
    queryKey: ['teams'],
    queryFn: getTeamsApi,
    enabled: !!currentUser,
  });

  // 활동 중인 팀원 목록 전용 쿼리
  const { data: onlineUsersData } = useQuery<GetOnlineUsersResponse>({
    queryKey: ['onlineUsers', activeTeamId],
    queryFn: () => {
      console.log("🚀 온라인 유저 API 호출 시도! 팀 ID:", activeTeamId);
      return getOnlineUsersApi(Number(activeTeamId));
    },
    enabled: !!activeTeamId && activeTeamId !== '0',
  });

  // 활성화된 팀의 테스크 목록 조회
  const { data: ticketData } = useQuery({
    queryKey: ['tickets', activeTeamId],
    queryFn: () => getTicketsApi(Number(activeTeamId)),
    enabled: !!activeTeamId,
  });

  const { data: detailData, error: detailError } = useQuery({
    queryKey: ['ticketDetail', selectedTicketId],
    queryFn: () => getTicketDetailApi(selectedTicketId!),
    enabled: !!selectedTicketId,
    staleTime: 0,
    retry: 0,
  });

  // 로그 데이터 조회 (React Query)
  const { data: logData } = useQuery({
    queryKey: ['logs', activeTeamId, activeLogTab],
    queryFn: () =>
      getTeamLogsApi(Number(activeTeamId), activeLogTab === 'mine'),
    enabled: !!activeTeamId,
  });

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

  // 활성화된 팀의 회의록 목록 조회
  const { data: noteData } = useQuery({
    queryKey: ['noteData', activeTeamId],
    queryFn: () => getNotesApi(Number(activeTeamId)),
    enabled: !!activeTeamId && !!currentUser,
  });

  const queryClient = useQueryClient();

  // Pusher 실시간 리스너
  useEffect(() => {
    if (!activeTeamId || !currentUser) return;

    const teamChannel = pusher.subscribe(`team-${activeTeamId}`);
    const userChannel = pusher.subscribe(`user-${currentUser.uuid}`);

    // 내 상태 업데이트 리스너
    teamChannel.bind('status-updated', () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['logs', activeTeamId] });
      queryClient.invalidateQueries({ queryKey: ['onlineUsers', activeTeamId] });
    });

    // 서버의 팀 목록 데이터를 무효화
    teamChannel.bind('task-status-updated', () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', activeTeamId] });
    });

    // 테스크 상태 업데이트 리스너
    teamChannel.bind(
      'task-status-updated',
      (data: { taskId: number; status: string }) => {
        console.log('📍 [실시간] 테스크 상태 변경 감지!', data);
        queryClient.invalidateQueries({ queryKey: ['tickets', activeTeamId] });
      },
    );

    // 개인별 테스크 할당 알림 리스너
    userChannel.bind('new-task-requested', () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', activeTeamId] });
      queryClient.invalidateQueries({ queryKey: ['logs', activeTeamId] });
    });

    return () => {
      pusher.unsubscribe(`team-${activeTeamId}`);
      pusher.unsubscribe(`user-${currentUser.uuid}`);
    };
  }, [activeTeamId, currentUser, queryClient]);

  // 알림 해당 task 상세 조회 실패 예외 처리
  useEffect(() => {
    if (detailError && axios.isAxiosError(detailError)) {
      const statusCode = detailError.response?.status;

      if (statusCode === 404) {
        toast.error("존재하지 않거나 삭제된 테스크입니다.", {
          icon: '🗑️',
          duration: 4000,
          style: {
            minWidth: '350px',
            maxWidth: '500px',
            padding: '16px 24px',
            background: '#ffffff',
            color: '#1e293b',
            borderRadius: '16px',
            fontSize: '13px',
            fontWeight: '700',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }
        });

        setSelectedTicketId(null);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    }
  }, [detailError, setSelectedTicketId, queryClient]);

  useEffect(() => {
    // 특정 테스크 모달이 열려 있을 때만 리스너를 가동합니다.
    if (!selectedTicketId) return;

    console.log(`[Pusher] #${selectedTicketId} 테스크 채널 구독 시도...`);
    const taskChannel = pusher.subscribe(`task-${selectedTicketId}`);

    taskChannel.bind('new-comment', (data: PusherCommentData) => {
      console.log('💬 [Pusher] 실시간 댓글 이벤트 발생!', data);
      // 💡 여기서 invalidateQueries를 호출해야 위 useMemo가 다시 작동합니다.
      queryClient.invalidateQueries({
        queryKey: ['ticketDetail', selectedTicketId],
      });
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
      queryClient.invalidateQueries({
        queryKey: ['ticketDetail', selectedTicketId],
      });
    }
  };

  const onDeleteComment = async (commentId: number) => {
    /* 삭제 로직 */
    const response = await DeleteCommentApi(commentId);
    if (response.success) {
      queryClient.invalidateQueries({
        queryKey: ['ticketDetail', selectedTicketId],
      });
    }
  };

  // teams 변수를 서버 데이터로부터 생성
  const teams = useMemo(() => {
    return teamListData?.data
      ? teamListData.data.map(convertTeam)
      : [INITIAL_TEAM];
  }, [teamListData]);

  // 현재 활성화된 팀 객체를 실시간으로 찾아 유지
  const activeTeam = useMemo(() => {
    if (!teamListData?.data || !activeTeamId) return null;
    const rawTeam = teamListData.data.find(
      (t: TeamFromApi) => String(t.id) === String(activeTeamId),
    );
    if (!rawTeam) return null;

    // 기본 구조 변환 (Team 객체 초기화)
    const baseTeam = convertTeam(rawTeam);

    if (ticketData?.success && ticketData.data.tasks) {
      baseTeam.tickets = ticketData.data.tasks.map(
        (task: TaskBaseFromApi): Ticket => {
          const isSelected =
            selectedTicketId !== null &&
            Number(task.id) === Number(selectedTicketId);

          // 상세 데이터 타입 캐스팅
          const detailMatch =
            detailData?.success &&
            String(detailData.data.id) === String(task.id);
          const currentDetail = detailMatch ? detailData.data : null;

          let serverComments: TaskComment[] = [];

          if (isSelected && currentDetail && 'comments' in currentDetail) {
            serverComments = currentDetail.comments.map((c: TaskCommentFromApi): TaskComment => {
              return {
                id: c.id,
                user: c.user.name,
                text: c.content,
                time: new Date(c.created_at).toLocaleTimeString('ko-KR', {
                  hour12: false,
                }),
                is_edited: Boolean(c.is_edited),
              };
            });
          }

          return {
            id: task.id,
            task_number: task.task_number,
            title: task.title,
            content: task.content,
            status: task.status || 'Todo',
            requester: task.requester_name,
            requester_id: String(task.requester_id),
            worker: task.worker_name,
            worker_id: String(task.worker_id),
            createdAt: task.created_at?.split('T')[0] || '',
            comments: serverComments,
            is_edited: task.is_edited || false
          };
        },
      );
    }

    // 로그 조립
    if (logData?.success && Array.isArray(logData.data)) {
      baseTeam.logs = logData.data.map(
        (log: {
          id: number;
          task_id: number;
          user: { name: string };
          message: string;
          created_at: string;
          action_type: string;
        }) => ({
          id: log.id,
          ticketId: log.task_id,
          user: log.user.name,
          action: log.message,
          time: new Date(log.created_at).toLocaleTimeString('ko-KR', {
            hour12: false,
          }),
          type: getLogDisplayType(log.action_type),
        }),
      );
    }

    // 아카이브(링크/문서) 데이터 조립 추가
    const rawLinks = linkData?.data || [];
    const rawDocs = docData?.data || [];
    baseTeam.links = [...rawLinks, ...rawDocs]
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      .map((link: TeamArchiveData) => ({
        id: link.id,
        type: link.type,
        title: link.title,
        content: link.content,
        created_at: link.created_at,
      }));

    // 아카이브 회의록 데이터 조립

    baseTeam.notes =
      noteData?.data.map((note: TeamArchiveData) => ({
        id: note.id,
        type: note.type,
        title: note.title,
        content: note.content,
        created_at: note.created_at,
      })) || [];

    return baseTeam;
  }, [
    activeTeamId,
    teamListData,
    ticketData,
    logData,
    detailData,
    selectedTicketId,
    linkData,
    docData,
    noteData,
  ]);

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

  // 내 상태 업데이트
  const updateMyStatus = async (newStatus: string) => {
    if (!activeTeamId || !currentUser) return;
    try {
      const response = await updateMyStatusApi(Number(activeTeamId), newStatus);
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['teams'] });
      }
    } catch (error: unknown) {
      console.error('내 상태 변경 실패:', error);
    }
  };

  const joinTeam = async (teamId: string, password: string) => {
    if (!currentUser) return { ok: false, message: '유저 정보가 없습니다.' };

    try {
      // 받아온 teamId와 password를 API 함수에 전달하여 사용
      const response = await joinTeamApi(String(teamId), {
        password,
        userId: Number(currentUser.id), // 현재 유저의 ID 전달
      });

      if (response.success) {
        // 가입 성공 시 서버의 팀 목록을 새로고침
        await queryClient.invalidateQueries({ queryKey: ['teams'] });
        return { ok: true, message: '팀 가입이 완료되었습니다.' };
      }

      return { ok: false, message: response.error || '가입에 실패했습니다.' };
    } catch (error: unknown) {
      console.error('팀 가입 중 오류:', error);
      return { ok: false, message: '서버 통신 중 오류가 발생했습니다.' };
    }
  };

  // 데이터 가공
  const onlineUsers = useMemo(() => {
  // 여기서 onlineUsersData는 이제 GetOnlineUsersResponse 형식이 됩니다.
  if (!onlineUsersData?.success || !onlineUsersData.data) return [];
  
    return onlineUsersData.data.map((item: OnlineUserFromApi) => {
      const avatarIndex = item.id % AVATARS.length;
      const matched = USER_ACTIVITIES.find(a => a.label === item.status);

      return {
        id: item.id,
        name: item.user.name,
        avatar: item.user.profile_image || AVATARS[avatarIndex],
        status: item.status, 
        statusColor: matched?.color || 'bg-green-500'
      };
    });
  }, [onlineUsersData]);

  // task 상태 변경
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
      const response = await apiMap[actionType](taskId);
      if (response.data?.success) {
        await queryClient.invalidateQueries({
          queryKey: ['tickets', activeTeamId],
        });
        await queryClient.invalidateQueries({
          queryKey: ['logs', activeTeamId],
        });
        return { ok: true };
      }
    } catch (error: unknown) {
      console.error('상태 변경 오류:', error);
      return { ok: false };
    }
  };

  const handleDeleteTicketApi = async (ticketId: number) => {
    console.log(`[삭제 시도] 티켓:${ticketId}, 활성팀:${activeTeamId}`);

    try {
      const response = await deleteTicketApi(ticketId);

      if (response.success) {
        await queryClient.invalidateQueries({
          queryKey: ['tickets', activeTeamId],
        });

        return { ok: true };
      }
      return { ok: false, message: response.error || '삭제 권한이 없습니다.' };
    } catch {
      return { ok: false, message: '서버에서 권한을 거부했습니다.' };
    }
  };

  // task 수정 핸들러
  const onUpdateTicket = async (taskId: number, data: { title: string; content: string; worker_id: string }) => {
    try {
      const response = await UpdateTicketApi(taskId, data);
      if (response.success) {
        // task 무효화 후 최신 데이터로 업데이트
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['tickets', activeTeamId] }),
          queryClient.invalidateQueries({ queryKey: ['ticketDetail', taskId] })
        ]);
      }
    } catch (error) {
      console.error("❌ 테스크 수정 실패:", error);
      alert("수정에 실패했습니다.");
    }
  };


  /**
   * [기능] createTeam: 새 팀 생성
   */
  const createTeam = async (teamName: string, teamPassword: string) => {
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

    console.log('팀 생성 시도:', { teamName, teamPassword });

    // 성공했다고 가정하고 서버 데이터 새로고침
    await queryClient.invalidateQueries({ queryKey: ['teams'] });

    return {
      ok: true,
      message:
        '팀이 생성되었습니다. (서버 연동 시 자동으로 목록에 나타납니다.)',
    };
  };

  /**
   * [기능] handleCreateTicket: 새로운 업무 요청(티켓) 발행
   */
  const handleCreateTicket = async (
    title: string,
    content: string,
    worker_id: string,
  ) => {
    if (!currentUser || !activeTeamId) {
      console.error('생성 실패: 유저 정보나 활성화된 팀 ID가 없습니다.');
      return;
    }

    // task 생성 API 호출
    try {
      const response = await createTicketApi(Number(activeTeamId), {
        title,
        content,
        worker_id: String(worker_id),
      });

      if (response.success) {
        await queryClient.invalidateQueries({
          queryKey: ['tickets', activeTeamId],
        });
        await queryClient.invalidateQueries({
          queryKey: ['logs', activeTeamId],
        });
        console.log('✅ 티켓 생성 성공 및 데이터 동기화 완료');
      }
    } catch (error: unknown) {
      console.error('❌ 티켓 생성 중 오류 발생:', error);
      alert('티켓 생성에 실패했습니다.');
    }
  };

  /**
   * [기능] handleAddComment: 티켓 내 댓글 추가
   */
  const handleAddComment = async (ticketId: number, text: string) => {
    if (!text || !currentUser || !activeTeamId) return false;

    console.log(
      `🚀 [댓글전송] ${ticketId}번 테스크에 댓글 작성 시도: "${text}"`,
    );

    try {
      const response = await createCommentApi(ticketId, text);

      if (response.success) {
        console.log('✅ [서버응답] 댓글 저장 완료. 데이터를 새로고침합니다.');

        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ['ticketDetail', ticketId],
          }),
          queryClient.invalidateQueries({
            queryKey: ['tickets', activeTeamId],
          }),
          queryClient.invalidateQueries({ queryKey: ['logs', activeTeamId] }),
        ]);

        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ [에러] 댓글 작성 실패:', error);
      return false;
    }
  };

  /**
   * [기능] leaveTeam: 현재 유저를 팀 멤버 목록에서 제거
   */
  const leaveTeam = async (teamId: number) => {
    try {
      const response = await leaveTeamApi(teamId);

      if (response.success) {
        // 가입된 팀 목록이 바뀌었으므로 서버 데이터를 새로고침
        await queryClient.invalidateQueries({ queryKey: ['teams'] });
        
        // 현재 활성화된 팀 ID 정보 삭제
        setActiveTeamId(null);
        return { ok: true };
      }
      return { ok: false, message: response.error || '탈퇴 처리 실패' };
    } catch (error) {
      console.error('탈퇴 API 호출 에러:', error);
      throw error;
    }
  };
  // 내 포지션 수정
  const handleEditPosition = async (newPosition: string) => {
    if (!activeTeamId || !currentUser) return;

    try {
      console.log(`포지션 변경 시도: ${newPosition}`);
      await queryClient.invalidateQueries({ queryKey: ['teams'] });
    } catch (error: unknown) {
      console.error('포지션 수정 실패:', error);
    }
  };

  // 아카이브 > 퀵 링크 생성
  const handleCreateQuickLink = async () => {
    // 💡 setTeams 삭제 -> API 호출 후 invalidateQueries(['linkData']) 사용
    await queryClient.invalidateQueries({
      queryKey: ['linkData', activeTeamId],
    });
  };

  // 아카이브 > 퀵 링크 삭제
  const handleDeleteQuickLink = async (linkId: number) => {
    await deleteQuickLinkApi(linkId);
    await queryClient.invalidateQueries({
      queryKey: ['linkData', activeTeamId],
    });
  };

  // 아카이브 > 문서 생성
  const handleCreateDoc = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['docData', activeTeamId],
    });
  };

  // 아카이브 > 문서 삭제 (링크 삭제와 동일하게 처리)
  const handleDeleteDoc = async (docId: number) => {
    await deleteDocApi(docId);
    await queryClient.invalidateQueries({
      queryKey: ['docData', activeTeamId],
    });
  };

  // 회의록 생성
  const createNote = async (data: NoteRequest) => {
    await createNoteApi(Number(activeTeamId), data);

    await queryClient.invalidateQueries({
      queryKey: ['noteData', activeTeamId],
    });
  };

  // 회의록 수정
  const editNote = async (noteId: number, data: NoteRequest) => {
    await editNoteApi(noteId, data);

    await queryClient.invalidateQueries({
      queryKey: ['noteData', activeTeamId],
    });
  };

  // 회의록 삭제
  const deleteNote = async (noteId: number) => {
    await deleteNoteApi(noteId);
    await queryClient.invalidateQueries({
      queryKey: ['noteData', activeTeamId],
    });
  };
  // 외부 컴포넌트에서 사용할 데이터와 함수 반환
  return {
    currentUser,
    teams,
    activeTeamId,
    setActiveTeamId,
    updateMyStatus,
    activeTeam,
    joinedTeams,
    availableTeams,
    isTeamNameTaken,
    isValidTeamPassword,
    createTeam,
    onlineUsers,
    joinTeam,
    updateTicketStatus,
    handleCreateTicket,
    handleAddComment,
    onUpdateComment,
    onDeleteComment,
    leaveTeam,
    activeLogTab,
    setActiveLogTab,
    handleDeleteTicketApi,
    onUpdateTicket,
    handleEditPosition,
    pendingTeamId,
    setPendingTeamId,
    handleCreateQuickLink,
    handleDeleteQuickLink,
    handleCreateDoc,
    handleDeleteDoc,
    createNote,
    editNote,
    deleteNote,
  };
};
