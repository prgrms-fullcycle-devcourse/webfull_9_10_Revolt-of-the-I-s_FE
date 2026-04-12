import { useRef, useState, useEffect, useCallback } from 'react';
import type { AxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTeamApi, joinTeamApi } from './api/team';
import { type JoinTeamRequest } from './types';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { logoutApi, getMyInfoApi } from './api/auth';
import {
  type EditMemberPositionRequest,
  editMemberPositionApi,
} from './api/member';
import { createDocApi, createQuickLinkApi } from './api/archive';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Toaster } from "react-hot-toast";

// 레이아웃 및 페이지
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Lobby } from './pages/Lobby';
import { Dashboard } from './pages/Dashboard';
import { Archive } from './pages/Archive';
import { Members } from './pages/Members';
import { TicketDetail } from './components/task/TicketDetail';

// 공통 UI 및 모달
import { Modal } from './components/ui/Modal';

// 훅 및 타입
import { useTeams } from './hooks/useTeams';
import { type Member, type CurrentUser, type TeamArchiveData } from './types';
import { validateUrl } from './utils/validation';
import { updateMyStatusApi } from "./api/status";

export default function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  // --- 데이터 로직 (Custom Hook) ---
  const {
    // setTeams,
    activeTeamId,
    setActiveTeamId,
    activeTeam,
    onlineUsers,
    pendingTeamId,
    updateMyStatus,
    setPendingTeamId,
    updateTicketStatus,
    handleAddComment,
    onUpdateComment,
    onDeleteComment,
    handleDeleteTicketApi,
    onUpdateTicket,
    handleEditPosition,
    handleCreateQuickLink,
    handleDeleteQuickLink,
    handleCreateDoc,
    handleDeleteDoc,
    activeLogTab,
    setActiveLogTab,
    createNote,
    leaveTeam,
    editNote,
    deleteNote,
  } = useTeams(currentUser, selectedTicketId, setSelectedTicketId);

  // --- UI 상태 관리 ---
  const [isTeamAuthorized, setIsTeamAuthorized] = useState<boolean>(() => {
    return localStorage.getItem('isTeamAuthorized') === 'true';
  });
  const savedView = localStorage.getItem('currentView') as
    | 'dashboard'
    | 'members'
    | 'archive'
    | null;
  const [view, setView] = useState<'dashboard' | 'members' | 'archive'>(
    savedView || 'dashboard',
  );
  const [activeModal, setActiveModal] = useState<
    | 'create'
    | 'note'
    | 'link'
    | 'createTeam'
    | 'auth'
    | 'position'
    | 'document'
    | 'updateNote'
    | 'deleteLink'
    | null
  >(null);

  const [authPage, setAuthPage] = useState<'login' | 'signup'>('login');

  const selectedTicket =
    activeTeam?.tickets.find((t) => t.id === selectedTicketId) ?? null;

  // 회의록 상태
  const [isNotePending, setIsNotePending] = useState<boolean>(false);
  const [selectedNote, setSelectedNote] = useState<TeamArchiveData | null>(
    null,
  );
  const [noteData, setNoteData] = useState<{ title: string; content: string }>({
    title: '',
    content: '',
  });
  const isFormValid =
    noteData.title.trim().length > 0 &&
    noteData.title.length <= 100 &&
    noteData.content.trim().length > 0;
  const [isEditNotePending, setIsEditNotePending] = useState<boolean>(false);

  // 포지션 수정 관련 상태
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [myPosition, setMyPosition] = useState<string>('');
  const isPositionValid =
    myPosition.trim().length > 0 &&
    myPosition !==
      (activeTeam?.members.find((m) => m.email === currentUser?.email)
        ?.position || '');
  const [isPositionPending, setIsPositionPending] = useState<boolean>(false);

  // 링크, 문서 관련 상태
  const [linkData, setLinkData] = useState<{ title: string; content: string }>({
    title: '',
    content: '',
  });
  const isLinkValid =
    linkData.title.length > 0 && validateUrl(linkData.content);
  const [isLinkPending, setIsLinkPending] = useState<boolean>(false);
  const [selectedLinkItem, setSelectedLinkItem] = useState<TeamArchiveData>();
  const [docData, setDocData] = useState<{ title: string; file: File | null }>({
    title: '',
    file: null,
  });
  const isDocValid = docData.title.length > 0 && docData.file !== null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDocPending, setIsDocPending] = useState<boolean>(false);

  // 팀 생성 비밀번호 상태
  const [createTeamPassword, setCreateTeamPassword] = useState('');
  const [showCreateTeamPassword, setShowCreateTeamPassword] = useState(false);

  // 보안 인증 입력 상태
  const [authPassword, setAuthPassword] = useState<string[]>(Array(6).fill(''));
  const [authError, setAuthError] = useState('');
  const authInputRef = useRef<HTMLInputElement | null>(null);

  // 보안 인증 입력 포커스 상태
  const [isAuthInputFocused, setIsAuthInputFocused] = useState(false);

  // 보안 인증 커서 위치
  const [authCursorIndex, setAuthCursorIndex] = useState(0);

  // 사용자가 직접 칸을 클릭해서 수정 중인지 확인
  const [isAuthManualEditing, setIsAuthManualEditing] = useState(false);

  // 보안 인증 숫자 표시 여부
  const [showAuthPassword, setShowAuthPassword] = useState(true);

  // 6자리 모두 입력됐는지 확인
  const isAuthPasswordComplete = authPassword.every((digit) => digit !== '');

  // 팀 목록 최신화를 위한 QueryClient
  const queryClient = useQueryClient();

  // 로그아웃 API 호출
  const logoutMutation = useMutation({ mutationFn: logoutApi });

  // 공통 상태 업데이트 헬퍼 함수
  const syncUserStatus = useCallback(async (teamId: number, status: string) => {
    try {
      await updateMyStatusApi(teamId, status);
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['onlineUsers', String(teamId)] });
    } catch (err) {
      console.warn(`[Status Sync] ${status} 업데이트 실패:`, err);
    }
  }, [queryClient]);

  // 팀 생성 API 호출
  const createTeamMutation = useMutation({
    mutationFn: createTeamApi,
    onSuccess: (data) => {
      if (!data.success || !data.data) {
        alert(data.error || '팀 생성에 실패했습니다.');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setActiveTeamId(String(data.data.id));
      setIsTeamAuthorized(true);
      setActiveModal(null);
    },
    onError: () => {
      alert('팀 생성에 실패했습니다.');
    },
  });

  // 팀 가입/입장 API 호출
  const joinTeamMutation = useMutation({
    mutationFn: ({ teamId, data }: { teamId: string; data: JoinTeamRequest }) =>
      joinTeamApi(teamId, data),
    onSuccess: async (data, variables) => {
      if (data && (data.success || data.data)) {
        console.log('팀 입장 성공!');

        // pusher 연결 재시작 (소켓 세션 갱신)
        import('./utils/pusher').then(({ pusher }) => pusher.connect());

        // 입장한 팀에 '업무 중'으로 상태 업데이트
        await syncUserStatus(Number(variables.teamId), '업무 중');

        if (pendingTeamId) {
          setActiveTeamId(pendingTeamId);
        }
        queryClient.invalidateQueries({ queryKey: ['teams'] });
        setIsTeamAuthorized(true);
        localStorage.setItem('isTeamAuthorized', 'true');
        setActiveModal(null);
        setAuthPassword(Array(6).fill(''));
        setAuthError('');
        setAuthCursorIndex(0);
        setShowAuthPassword(false);
        setIsAuthManualEditing(false);
        setPendingTeamId(null);
      } else {
        setAuthError(data?.error || '비밀번호가 일치하지 않습니다.');
      }
    },
    onError: (error: AxiosError<{ error?: string }>) => {
      console.error('입장 에러:', error);
      const serverErrorMessage = error.response?.data?.error;
      setAuthError(serverErrorMessage || '비밀번호가 일치하지 않습니다.');
    },
  });

  // 세션 복원 로직
  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ['myInfo'],
    queryFn: getMyInfoApi,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    console.log('userData:', userData);
    console.log('isUserLoading:', isUserLoading);
    if (userData) {
      const savedDisplayName = localStorage.getItem('displayName');
      const restoredName =
        userData.name || savedDisplayName || userData.email?.split('@')[0] || '사용자';

      if (userData.name) {
        localStorage.setItem('displayName', userData.name);
      }

      setCurrentUser({
        id: userData.id || Date.now(),
        uuid: userData.uuid,
        name: restoredName,
        avatar: userData.avatar || '',
        email: userData.email || '',
        phone: userData.phone || '',
        position: userData.position || '팀원',
        github: userData.github || '',
      });

      import('./utils/pusher').then(({ pusher }) => pusher.connect());

      const lastTeamId = localStorage.getItem('lastTeamId');
      const wasAuthorized = localStorage.getItem('isTeamAuthorized') === 'true';

      // [로그인 시 자동 처리] 세션 복원 시 마지막 활성 팀을 '업무 중'으로 변경
      if (lastTeamId) {
        syncUserStatus(Number(lastTeamId), '업무 중');
        
        if (wasAuthorized) {
          setActiveTeamId(lastTeamId);
          setIsTeamAuthorized(true);
        }
      }
    }
    if (!isUserLoading) {
      setIsAuthLoading(false);
    }
  }, [userData, isUserLoading, setActiveTeamId, queryClient, syncUserStatus]);

  // --- 세션 유지 로직 ---
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentView', view);
      localStorage.setItem('isTeamAuthorized', String(isTeamAuthorized));
      if (activeTeamId) {
        localStorage.setItem('lastTeamId', String(activeTeamId));
      }
    }
  }, [view, isTeamAuthorized, activeTeamId, currentUser]);

  // --- 브릿지 핸들러 (UI + Data Logic) ---

  // 새 팀 생성 (Lobby 전용)
  const handleCreateTeam = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;
    const formData = new FormData(e.currentTarget);

    createTeamMutation.mutate({
      name: formData.get('teamName') as string,
      pin_password: createTeamPassword,
    });
  };

  // 새 팀 개설 모달 닫기
  const handleCloseCreateTeamModal = () => {
    setActiveModal(null);
    setCreateTeamPassword('');
    setShowCreateTeamPassword(false);
  };

  // 보안 인증 모달 닫기
  const handleCloseAuthModal = () => {
    setActiveModal(null);
    setActiveTeamId(null);
    setAuthPassword(Array(6).fill(''));
    setAuthError('');
    setAuthCursorIndex(0);
    setShowAuthPassword(true);
    setIsAuthManualEditing(false);
  };

  // 보안 인증 붙여넣기 처리
  const handleAuthPasswordPaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    e.preventDefault();
    const onlyNumber = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    const nextPassword = Array(6).fill('');
    onlyNumber.split('').forEach((digit, index) => {
      nextPassword[index] = digit;
    });
    setAuthPassword(nextPassword);
    if (onlyNumber.length === 0) {
      setAuthCursorIndex(0);
    } else if (onlyNumber.length >= 6) {
      setAuthCursorIndex(5);
    } else {
      setAuthCursorIndex(onlyNumber.length);
    }
    setIsAuthManualEditing(false);
    if (authError) setAuthError('');
  };

  // 보안 인증 입력칸 포커스
  const handleFocusAuthInput = () => {
    authInputRef.current?.focus();

    const firstEmptyIndex = authPassword.findIndex((digit) => digit === '');
    if (firstEmptyIndex === -1) {
      setAuthCursorIndex(5);
    } else {
      setAuthCursorIndex(firstEmptyIndex);
    }

    setIsAuthManualEditing(false);
  };

  // 보안 인증 클릭한 칸으로 커서 이동
  const handleAuthBoxMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    index: number,
  ) => {
    e.preventDefault();
    authInputRef.current?.focus();
    setAuthCursorIndex(index);
    setIsAuthManualEditing(true);
  };

  // 보안 인증 숫자/백스페이스 입력 처리
  const handleAuthKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      const nextPassword = [...authPassword];

      if (nextPassword[authCursorIndex] !== '') {
        nextPassword[authCursorIndex] = '';
        setAuthPassword(nextPassword);
      } else if (authCursorIndex > 0) {
        nextPassword[authCursorIndex - 1] = '';
        setAuthPassword(nextPassword);
        setAuthCursorIndex(authCursorIndex - 1);
      }

      setIsAuthManualEditing(true);
      if (authError) setAuthError('');
      return;
    }

    if (e.key === 'Delete') {
      e.preventDefault();
      const nextPassword = [...authPassword];
      nextPassword[authCursorIndex] = '';
      setAuthPassword(nextPassword);

      setIsAuthManualEditing(true);
      if (authError) setAuthError('');
      return;
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setAuthCursorIndex((prev) => Math.max(prev - 1, 0));
      setIsAuthManualEditing(true);
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setAuthCursorIndex((prev) => Math.min(prev + 1, 5));
      setIsAuthManualEditing(true);
      return;
    }

    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
      return;
    }

    e.preventDefault();

    const nextPassword = [...authPassword];
    const isComplete = nextPassword.every((digit) => digit !== '');

    if (isComplete && !isAuthManualEditing) {
      return;
    }

    nextPassword[authCursorIndex] = e.key;
    setAuthPassword(nextPassword);

    if (authCursorIndex < 5 && nextPassword[authCursorIndex + 1] === '') {
      setAuthCursorIndex(authCursorIndex + 1);
      setIsAuthManualEditing(false);
    } else if (authCursorIndex < 5 && !isComplete) {
      setAuthCursorIndex(authCursorIndex + 1);
      setIsAuthManualEditing(false);
    }

    if (authError) setAuthError('');
  };

  // 팀 인증 (Lobby 전용)
  const handleTeamAuth = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pendingTeamId || !isAuthPasswordComplete) return;
    joinTeamMutation.mutate({
      teamId: pendingTeamId,
      data: {
        password: authPassword.join(''),
        userId: Number(currentUser!.id) || 0,
      },
    });
  };

  // 회의록 기록
  const handleCreateNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isNotePending) return;
    setIsNotePending(true);

    try {
      await createNote(noteData);

      alert('회의록이 성공적으로 기록되었습니다.');
      setActiveModal(null);
      setNoteData({ title: '', content: '' });
    } catch (error) {
      console.log(error);
    } finally {
      setIsNotePending(false);
    }
  };

  const handleOpenUpdateNoteModal = (note: TeamArchiveData) => {
    setNoteData({ title: note.title, content: note.content });
    setActiveModal('updateNote');
  };

  // 회의록 수정
  const handlerEditNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isEditNotePending || !selectedNote) return;
    setIsEditNotePending(true);

    try {
      await editNote(selectedNote.id, noteData);
      setSelectedNote({ ...selectedNote, ...noteData });
      alert('회의록이 성공적으로 수정되었습니다.');
      setActiveModal(null);
    } catch (error) {
      console.log(error);
    } finally {
      setIsEditNotePending(false);
    }
  };

  // 회의록 삭제
  const handleDeleteNote = async (e: React.MouseEvent) => {
    e.preventDefault();

    const noteId = selectedNote?.id;
    if (!noteId) return;
    if (!window.confirm('정말 이 회의록을 삭제하시겠습니까?')) return;

    try {
      await deleteNote(noteId);
      alert('회의록이 성공적으로 삭제되었습니다.');
      setSelectedNote(null);
    } catch (error) {
      console.log(error);
      alert('회의록 삭제에 실패했습니다.');
    }
  };

  // 새로운 링크 생성
  const createLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLinkPending) return;
    setIsLinkPending(true);

    try {
      const formData = new FormData(e.currentTarget);

      const newLinkData = {
        title: formData.get('title') as string,
        content: (formData.get('content') as string).trim(),
      };

      const result = await createQuickLinkApi(
        Number(activeTeamId),
        newLinkData,
      );
      console.log('링크 추가 성공 : ', result);

      handleCreateQuickLink();

      setActiveModal(null);
      setLinkData({ title: '', content: '' });
      alert(`링크가 성공적으로 추가되었습니다.`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log('API 호출 실패 :', error.message);
        alert(error.message || '링크 생성에 실패했습니다.');
      } else {
        console.log('알 수 없는 에러 발생 :', error);
        alert('링크 생성에 실패했습니다.');
      }
      setActiveModal(null);
    } finally {
      setIsLinkPending(false);
    }
  };

  // 링크, 문서 삭제 핸들링
  const handleDeleteLinkOrDoc = (e: React.MouseEvent) => {
    const linkType = selectedLinkItem?.type;

    if (linkType === 'LINK') {
      deleteLink(e);
    } else {
      deleteDocument(e);
    }
  };

  // 링크 삭제
  const deleteLink = (e: React.MouseEvent) => {
    e.preventDefault();

    const linkId = selectedLinkItem?.id;
    if (!linkId) return;
    try {
      handleDeleteQuickLink(linkId);

      console.log(`퀵 링크 id : ${linkId}의 링크를 삭제 성공했습니다.`);
      setActiveModal(null);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log('API 호출 실패 :', error.message);
        alert(error.message || '링크 삭제에 실패했습니다.');
      } else {
        console.log('알 수 없는 에러 발생 :', error);
        alert('링크 삭제에 실패했습니다.');
      }
      setActiveModal(null);
    }
  };

  // 문서 생성
  const createDocument = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isDocPending) return;
    setIsDocPending(true);

    try {
      const formData = new FormData(e.currentTarget);

      const newDocData = {
        title: formData.get('title') as string,
        file: formData.get('file') as File,
      };

      const result = await createDocApi(Number(activeTeamId), newDocData);
      console.log('문서 추가 성공 : ', result);

      handleCreateDoc();

      setActiveModal(null);
      console.log(docData);
      setDocData({ title: '', file: null });
      alert(`문서가 성공적으로 추가되었습니다.`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log('문서 생성 API 호출 실패 :', error.message);
        alert(error.message || '문서 생성에 실패했습니다.');
      } else {
        console.log('알 수 없는 에러 발생 :', error);
        alert('문서 생성에 실패했습니다.');
      }
      setActiveModal(null);
    } finally {
      setIsDocPending(false);
    }
  };

  // 문서 삭제
  const deleteDocument = (e: React.MouseEvent) => {
    e.preventDefault();

    try {
      const docId = selectedLinkItem?.id;
      if (!docId) return;

      handleDeleteDoc(docId);
      setActiveModal(null);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log('문서 삭제 API 호출 실패 :', error.message);
        alert(error.message || '문서 삭제에 실패했습니다.');
      } else {
        console.log('알 수 없는 에러 발생 :', error);
        alert('문서 삭제에 실패했습니다.');
      }
    }
  };

  const handleLeaveTeam = async (teamId: string | number | null) => {
  if (!teamId) return;
  try {
    await leaveTeam(Number(teamId));

      setIsTeamAuthorized(false);
      setActiveTeamId(null);
      setView('dashboard');

      setTimeout(() => {
        alert('팀 탈퇴가 완료되었습니다.');
      }, 100);
    } catch (error: unknown) {
      console.error('탈퇴 처리 중 오류:', error);
      alert('팀 탈퇴 처리 중 문제가 발생했습니다.');
    }
  };

  // 포지션 수정
  const editPosition = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPositionPending) return;
    setIsPositionPending(true);

    try {
      const editPositionData: EditMemberPositionRequest = {
        position: myPosition,
      };

      const { success } = await editMemberPositionApi(
        Number(activeTeamId),
        editPositionData,
      );

      handleEditPosition(myPosition);
      console.log('포지션 수정 성공 결과', success);

      setActiveModal(null);
      alert(`내 포지션이 "${myPosition}" 성공적으로 변경되었습니다.`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log('포지션 수정 API 호출 실패 :', error.message);
        alert(error.message || '포지션 수정에 실패했습니다.');
      } else {
        console.log('알 수 없는 에러 발생 :', error);
        alert('포지션 수정에 실패했습니다.');
      }
    } finally {
      setIsPositionPending(false);
    }
  };

  // 공통 로그아웃 처리
  const handleLogout = async () => {
    try {
      // 로그아웃 시, '자리 비움'으로 상태 변경
      if (activeTeamId) {
        try {
          await syncUserStatus(Number(activeTeamId), '자리 비움');
        } catch (err) {
          console.warn("로그아웃 상태 업데이트 실패 (무시하고 로그아웃 진행):", err);
        }
      }

      const data = await logoutMutation.mutateAsync();
      if (!data.success) {
        alert(data.error || '로그아웃에 실패했습니다.');
        return;
      }
      if (data.data?.message) {
        alert(data.data.message);
      } else {
        alert('로그아웃 되었습니다.');
      }
      setCurrentUser(null);
      setActiveTeamId(null);
      setIsTeamAuthorized(false);
      setActiveModal(null);
      setAuthPassword(Array(6).fill(''));
      setAuthError('');
      setAuthCursorIndex(0);
      setIsAuthManualEditing(false);
      setShowAuthPassword(true);
      setAuthPage('login');
    } catch (error) {
      console.log(error);
      alert('로그아웃에 실패했습니다.');
      // 토큰 만료 시, 내 브라우저에서 자리비움 처리
      setCurrentUser(null);
      setActiveTeamId(null);
      setIsTeamAuthorized(false);
      setAuthPage('login');
    }
  };

  // --- 조건부 렌더링 ---
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-blue-500 font-black animate-pulse">
          인증 정보 확인 중...
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return authPage === 'login' ? (
      <Login
        key="login"
        setCurrentUser={setCurrentUser}
        goSignup={() => setAuthPage('signup')}
      />
    ) : (
      <Signup key="signup" goLogin={() => setAuthPage('login')} />
    );
  }

  return (
    <>
    {/* 토스트 알림 기능 */}
    <Toaster 
        position="top-right" // 알림 위치: 우측 상단
        reverseOrder={false}
        toastOptions={{
          style: {
            fontFamily: 'Pretendard, sans-serif',
            fontSize: '17px',
          },
        }}
      />

      {!activeTeamId || !isTeamAuthorized || !activeTeam ? (
        <Lobby
          currentUser={currentUser}
          onLogout={handleLogout}
          setPendingTeamId={setPendingTeamId}
          setIsTeamAuthorized={setIsTeamAuthorized}
          setIsCreateTeamModalOpen={() => setActiveModal('createTeam')}
          setIsTeamAuthModalOpen={() => setActiveModal('auth')}
        />
      ) : (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
          <Sidebar
            activeTeam={activeTeam!}
            activeTeamId={activeTeamId}
            currentUser={currentUser}
            updateMyStatus={updateMyStatus}
            view={view}
            setView={setView}
            setIsTeamAuthorized={setIsTeamAuthorized}
            onLogout={handleLogout}
            setActiveTeamId={setActiveTeamId}
            onLeaveTeam={handleLeaveTeam}
            activeLogTab={activeLogTab}
            setActiveLogTab={setActiveLogTab}
          />
          <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            <Header
              view={view}
              activeTeam={activeTeam!}
              onlineUsers={onlineUsers || []}
              setIsCreateModalOpen={() => setActiveModal('create')}
              currentUser={currentUser}
              setSelectedTicketId={setSelectedTicketId}
            />
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              {view === 'dashboard' && activeTeam && (
                <Dashboard
                  activeTeam={activeTeam}
                  activeTeamId={activeTeamId}
                  currentUser={currentUser}
                  setSelectedTicketId={setSelectedTicketId}
                  updateTicketStatus={updateTicketStatus}
                  activeModal={activeModal}
                  setActiveModal={setActiveModal}
                />
              )}
              {view === 'members' && (
                <Members
                  activeTeam={activeTeam!}
                  currentUser={currentUser}
                  editPosition={(member: Member) => {
                    setActiveModal('position');
                    setSelectedMember(member);
                  }}
                />
              )}
              {view === 'archive' && (
                <Archive
                  activeTeam={activeTeam!}
                  setIsLinkModalOpen={() => setActiveModal('link')}
                  setIsDocModalOpen={() => setActiveModal('document')}
                  setIsNoteModalOpen={() => setActiveModal('note')}
                  setIsDeleteLinkModalOpen={() => {
                    setActiveModal('deleteLink');
                  }}
                  setSelectedNote={(note) => setSelectedNote(note)}
                  setSelectedLinkItem={(link) => setSelectedLinkItem(link)}
                />
              )}
            </div>
          </main>
        </div>
      )}

      {/* 공통 모달 영역 */}
      <Modal
        isOpen={activeModal === 'createTeam'}
        onClose={handleCloseCreateTeamModal}
        title="새 팀 개설"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateTeam} className="space-y-4">
          <input
            name="teamName"
            required
            minLength={2}
            maxLength={30}
            className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold border border-slate-100 focus:ring-2 focus:ring-blue-500"
            placeholder="팀 이름"
          />
          {/* 팀 비밀번호 6자리 숫자 입력 + 보기/숨기기 */}
          <div className="space-y-2">
            <div className="relative">
              <input
                name="teamPassword"
                type={showCreateTeamPassword ? 'text' : 'password'}
                inputMode="numeric"
                required
                maxLength={6}
                value={createTeamPassword}
                onChange={(e) =>
                  setCreateTeamPassword(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                className="hide-password-toggle w-full px-5 py-4 pr-12 bg-slate-50 rounded-2xl outline-none font-bold border border-slate-100 focus:ring-2 focus:ring-blue-500"
                placeholder="비밀번호 6자리"
                title="팀 비밀번호는 숫자 6자리로 입력해주세요."
              />
              <button
                type="button"
                onClick={() => setShowCreateTeamPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
              >
                {showCreateTeamPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              팀 비밀번호는 숫자 6자리로 입력해주세요.
            </p>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-blue-700 transition-all"
          >
            팀 생성 및 입장
          </button>
          <button
            type="button"
            onClick={handleCloseCreateTeamModal}
            className="w-full bg-slate-100 text-slate-700 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all"
          >
            취소
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={activeModal === 'auth'}
        onClose={handleCloseAuthModal}
        title="보안 인증"
        maxWidth="max-w-md"
      >
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900">
                비밀번호를 입력하세요
              </p>
              <p className="mt-1 text-xs text-slate-400">
                6자리 숫자가 각 칸에 그대로 표시됩니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAuthPassword((prev) => !prev)}
              className="text-slate-400 hover:text-slate-700 transition-colors"
            >
              {showAuthPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <form onSubmit={handleTeamAuth} className="space-y-4">
            <input
              ref={authInputRef}
              name="password"
              type="text"
              inputMode="numeric"
              autoFocus
              onKeyDown={handleAuthKeyDown}
              onPaste={handleAuthPasswordPaste}
              onFocus={() => setIsAuthInputFocused(true)}
              onBlur={() => setIsAuthInputFocused(false)}
              className="absolute opacity-0 pointer-events-none"
            />
            <div
              onClick={handleFocusAuthInput}
              className="grid grid-cols-6 gap-2 cursor-text"
            >
              {Array.from({ length: 6 }).map((_, index) => {
                const isCurrentCursor =
                  isAuthInputFocused && index === authCursorIndex;
                return (
                  <div
                    key={index}
                    onMouseDown={(e) => handleAuthBoxMouseDown(e, index)}
                    className="h-12 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center text-lg font-black text-slate-700"
                  >
                    {authPassword[index] ? (
                      <div className="flex items-center gap-1">
                        <span>
                          {showAuthPassword ? authPassword[index] : '•'}
                        </span>
                        {isCurrentCursor && (
                          <span className="h-6 w-0.5 bg-blue-600 animate-pulse rounded-full" />
                        )}
                      </div>
                    ) : isCurrentCursor ? (
                      <span className="h-6 w-0.5 bg-blue-600 animate-pulse rounded-full" />
                    ) : (
                      ''
                    )}
                  </div>
                );
              })}
            </div>
            <button
              type="submit"
              disabled={!isAuthPasswordComplete}
              className={`w-full font-black py-4 rounded-2xl shadow-lg transition-all ${
                isAuthPasswordComplete
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              인증 및 입장
            </button>
            {authError && (
              <p className="text-sm font-bold text-red-500 text-center">
                {authError}
              </p>
            )}
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'note'}
        onClose={() => {
          setActiveModal(null);
          setNoteData({ title: '', content: '' });
        }}
        title="회의록 기록"
      >
        <form onSubmit={handleCreateNote}>
          <input
            name="title"
            onChange={(e) =>
              setNoteData({ ...noteData, title: e.target.value })
            }
            maxLength={100}
            required
            className="w-full px-6 py-4 mb-1 bg-slate-50 rounded-2xl outline-none font-bold"
            placeholder="회의 제목"
          />
          <span
            className={`flex justify-end mb-6 text-xs font-medium ${
              noteData.title.length > 100 ? 'text-red-500' : 'text-slate-400'
            }`}
          >
            {noteData.title.length} / 100
          </span>

          <textarea
            name="content"
            onChange={(e) =>
              setNoteData({ ...noteData, content: e.target.value })
            }
            required
            rows={8}
            className="w-full px-6 py-4 mb-6 bg-slate-50 rounded-2xl outline-none"
            placeholder="내용 입력"
          />
          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full py-4 rounded-2xl font-black shadow-lg ${
              isFormValid
                ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            기록하기
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={activeModal === 'link'}
        onClose={() => {
          setActiveModal(null);
          setLinkData({ title: '', content: '' });
        }}
        title="공유 링크 추가"
      >
        <form onSubmit={createLink} className="space-y-6">
          <input
            name="title"
            onChange={(e) =>
              setLinkData({ ...linkData, title: e.target.value })
            }
            required
            className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
            placeholder="사이트 이름"
          />
          <input
            name="content"
            onChange={(e) =>
              setLinkData({ ...linkData, content: e.target.value })
            }
            type="url"
            defaultValue={'https://'}
            required
            className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-mono"
            placeholder="https://..."
          />
          <button
            type="submit"
            disabled={!isLinkValid || isLinkPending}
            className={`w-full py-4 rounded-2xl font-black shadow-lg transition-colors ${
              isLinkValid && !isLinkPending
                ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            등록하기
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={activeModal === 'document'}
        onClose={() => {
          setActiveModal(null);
          setDocData({ title: '', file: null });
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
        title="문서 링크 추가"
      >
        <form onSubmit={createDocument} className="space-y-6">
          <input
            name="title"
            required
            onChange={(e) => setDocData({ ...docData, title: e.target.value })}
            className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
            placeholder="문서 이름"
          />
          <input
            name="file"
            id="file-upload"
            type="file"
            accept=".pdf"
            ref={fileInputRef}
            required
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setDocData({ ...docData, file: file });
            }}
            className="hidden"
          />
          {docData.file ? (
            <div className="flex justify-between w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold">
              <span>📄 {docData.file.name}</span>
              <button
                type="button"
                onClick={() => {
                  setDocData({ ...docData, file: null });
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="group cursor-pointer rounded-md"
              >
                <Trash2 className="text-slate-500 group-hover:text-red-400" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="file-upload"
              className="block w-full px-6 py-4 bg-slate-50 font-bold rounded-2xl hover:bg-slate-200 outline-none cursor-pointer"
            >
              <span>pdf 파일 첨부</span>
            </label>
          )}
          <button
            type="submit"
            disabled={!isDocValid || isDocPending}
            className={`w-full py-4 rounded-2xl font-black shadow-lg transition-colors ${
              isDocValid && !isDocPending
                ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            등록하기
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={activeModal === 'position'}
        onClose={() => {
          setActiveModal(null);
          setMyPosition('');
        }}
        title="내 포지션 수정"
      >
        <form className="space-y-6" onSubmit={editPosition}>
          <input
            name="title"
            className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
            placeholder="팀원"
            defaultValue={
              selectedMember?.position !== '팀원'
                ? selectedMember?.position
                : ''
            }
            onChange={(e) => setMyPosition(e.target.value)}
          />
          <button
            type="submit"
            disabled={!isPositionValid || isPositionPending}
            className={`w-full py-4 rounded-2xl font-black shadow-lg transition-colors ${
              isPositionValid && !isPositionPending
                ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            수정하기
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={activeModal === 'deleteLink'}
        onClose={() => setActiveModal(null)}
        title={`${selectedLinkItem?.type === 'LINK' ? '퀵 링크' : '문서'}를 삭제하시겠어요?`}
      >
        <div className="flex justify-between items-center gap-2">
          <button
            className="bg-red-100 w-full hover:bg-red-200 text-red-500 px py-3 rounded-2xl font-black shadow-lg cursor-pointer"
            onClick={(e) => handleDeleteLinkOrDoc(e)}
          >
            삭제하기
          </button>
          <button
            className="bg-slate-600 w-full hover:bg-slate-700 text-white py-3 rounded-2xl font-black shadow-lg cursor-pointer"
            onClick={() => setActiveModal(null)}
          >
            취소
          </button>
        </div>
      </Modal>

      {selectedTicket && currentUser && (
        <TicketDetail
          key={selectedTicket.id}
          ticket={selectedTicket}
          activeTeam={activeTeam!}
          currentUser={currentUser}
          onClose={() => setSelectedTicketId(null)}
          addComment={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleAddComment(
              selectedTicket.id,
              formData.get('comment') as string,
            );
            e.currentTarget.reset();
          }}
          onUpdateComment={onUpdateComment}
          onDeleteComment={onDeleteComment}
          activeTeamId={activeTeamId}
          handleDeleteTicketApi={handleDeleteTicketApi}
          onUpdateTicket={onUpdateTicket}
        />
      )}

      {selectedNote && (
        <Modal
          isOpen={!!selectedNote}
          onClose={() => setSelectedNote(null)}
          title="회의록 상세"
          maxWidth="max-w-2xl"
        >
          <div className="bg-slate-50 p-6 rounded-3xl mb-6">
            <p className="whitespace-pre-wrap mb-4 text-slate-800 leading-relaxed text-lg">
              {selectedNote.title}
            </p>
            <hr className="mb-4 text-slate-200" />
            <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {selectedNote.content}
              </ReactMarkdown>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={(e) => handleDeleteNote(e)}
              className="px-4 py-4 bg-red-100 hover:bg-red-200 text-red-500 rounded-2xl font-bold cursor-pointer"
            >
              회의록 삭제
            </button>
            <button
              onClick={() => handleOpenUpdateNoteModal(selectedNote)}
              className="px-4 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold cursor-pointer"
            >
              회의록 수정
            </button>
          </div>
        </Modal>
      )}

      <Modal
        isOpen={activeModal === 'updateNote'}
        onClose={() => {
          setActiveModal(null);
        }}
        title="회의록 수정"
      >
        <form onSubmit={handlerEditNote}>
          <input
            name="title"
            required
            className="w-full px-6 py-4 mb-1 bg-slate-50 rounded-2xl outline-none font-bold"
            placeholder="회의 제목"
            value={noteData.title}
            onChange={(e) =>
              setNoteData({ ...noteData, title: e.target.value })
            }
            maxLength={100}
          />
          <span
            className={`flex justify-end mb-6 text-xs font-medium ${
              noteData.title.length > 100 ? 'text-red-500' : 'text-slate-400'
            }`}
          >
            {noteData.title.length} / 100
          </span>
          <textarea
            name="content"
            required
            rows={8}
            className="w-full px-6 py-4 mb-6 bg-slate-50 rounded-2xl outline-none"
            placeholder="내용 입력"
            value={noteData.content}
            onChange={(e) =>
              setNoteData({ ...noteData, content: e.target.value })
            }
          />
          <button
            disabled={isEditNotePending || !isFormValid}
            className={`w-full py-4 rounded-2xl font-black shadow-lg transition-colors ${
              isEditNotePending || !isFormValid
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
            }`}
          >
            수정하기
          </button>
        </form>
      </Modal>
    </>
  );
}
