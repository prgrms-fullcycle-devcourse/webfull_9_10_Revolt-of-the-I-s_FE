import { useRef, useState, useEffect } from 'react';
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
import {
  type Member,
  type CurrentUser,
  type Note,
  type TeamLink,
} from './types';
import { validateUrl } from './utils/validation';

export default function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // --- 데이터 로직 (Custom Hook) ---
  const {
    setTeams,
    activeTeamId,
    setActiveTeamId,
    activeTeam,
    pendingTeamId,
    setPendingTeamId,
    updateTicketStatus,
    handleAddComment,
    addLog,
    handleDeleteTicketApi,
    handleEditPosition,
    handleCreateQuickLink,
    handleDeleteQuickLink,
    handleCreateDoc,
    handleDeleteDoc,
    isArchiveLoading,
  } = useTeams(currentUser);

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
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const selectedTicket =
    activeTeam?.tickets.find((t) => t.id === selectedTicketId) ?? null;

  // 회의록 상태
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [note, setNote] = useState<{ title: string; content: string }>({
    title: '',
    content: '',
  });
  const isNoteValid = note.title.length > 0 && note.content.length > 0;

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
  const [selectedLinkItem, setSelectedLinkItem] = useState<TeamLink>(null);

  const [docData, setDocData] = useState<{ title: string; file: File | null }>({
    title: '',
    file: null,
  });
  const isDocValid = docData.title.length > 0 && docData.file !== null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDocPending, setIsDocPending] = useState<boolean>(false);

  // 보안 인증 입력 상태
  const [authPassword, setAuthPassword] = useState<string[]>(Array(6).fill(''));
  const [authError, setAuthError] = useState('');
  const authInputRef = useRef<HTMLInputElement | null>(null);

  // 보안 인증 입력 포커스 상태
  const [isAuthInputFocused, setIsAuthInputFocused] = useState(false);

  // 보안 인증 커서 위치
  const [authCursorIndex, setAuthCursorIndex] = useState(0);

  // 보안 인증 숫자 표시 여부
  const [showAuthPassword, setShowAuthPassword] = useState(false);

  // 6자리 모두 입력됐는지 확인
  const isAuthPasswordComplete = authPassword.every((digit) => digit !== '');

  // 팀 목록 최신화를 위한 QueryClient
  const queryClient = useQueryClient();

  // 로그아웃 API 호출
  const logoutMutation = useMutation({ mutationFn: logoutApi });

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
    onSuccess: (data) => {
      if (!data.success) {
        setAuthError(data.error || '비밀번호가 일치하지 않습니다.');
        return;
      }

      // 인증 성공 시, 대기 중이던 ID를 활성 ID로 설정
      // useTeams의 useQuery가 작동하여 테스크 목록 호출
      if (pendingTeamId) {
        setActiveTeamId(pendingTeamId);

        addLog(0, currentUser!.name, '공간 입장', 'info', pendingTeamId);
      }

      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setIsTeamAuthorized(true);
      localStorage.setItem('isTeamAuthorized', 'true');
      setActiveModal(null);
      setAuthPassword(Array(6).fill(''));
      setAuthError('');
      setAuthCursorIndex(0);
      setShowAuthPassword(false);
      setPendingTeamId(null); // 인증 후에는 pendingTeamId 초기화
      addLog(0, currentUser!.name, '공간 입장', 'info');
    },
    onError: () => {
      setAuthError('비밀번호가 일치하지 않습니다.');
    },
  });

  // 세션 복원 로직
  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ['myInfo'],
    queryFn: getMyInfoApi,
    staleTime: Infinity, // 앱이 켜져 있는 동안은 다시 부르지 않음 (중복 호출 방지)
    gcTime: Infinity,
    retry: false, // 로그인 안 되어 있을 때 반복 호출 방지
  });

  useEffect(() => {
    if (userData) {
      setCurrentUser({
        id: userData.id || Date.now(),
        uuid: userData.uuid,
        name: userData.name || 'Unknown',
        avatar: userData.avatar || '',
        email: userData.email || '',
        phone: userData.phone || '',
        position: userData.position || '팀원',
        github: userData.github || '',
      });

      const lastTeamId = localStorage.getItem('lastTeamId');
      const wasAuthorized = localStorage.getItem('isTeamAuthorized') === 'true';
      if (lastTeamId && wasAuthorized) {
        setActiveTeamId(lastTeamId);
        setIsTeamAuthorized(true);
      }
    }
    if (!isUserLoading) {
      setIsAuthLoading(false);
    }
  }, [userData, isUserLoading, setActiveTeamId]);

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
      pin_password: formData.get('teamPassword') as string,
    });
  };

  // 새 팀 개설 모달 닫기
  const handleCloseCreateTeamModal = () => {
    setActiveModal(null);
  };

  // 보안 인증 모달 닫기
  const handleCloseAuthModal = () => {
    setActiveModal(null);
    setActiveTeamId(null);
    setAuthPassword(Array(6).fill(''));
    setAuthError('');
    setAuthCursorIndex(0);
    setShowAuthPassword(false);
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
    if (authError) setAuthError('');
  };

  // 보안 인증 입력칸 포커스
  const handleFocusAuthInput = () => {
    authInputRef.current?.focus();
  };

  // 보안 인증 클릭한 칸으로 커서 이동
  const handleAuthBoxMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    index: number,
  ) => {
    e.preventDefault();
    authInputRef.current?.focus();
    setAuthCursorIndex(index);
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
      if (authError) setAuthError('');
      return;
    }
    if (e.key === 'Delete') {
      e.preventDefault();
      const nextPassword = [...authPassword];
      nextPassword[authCursorIndex] = '';
      setAuthPassword(nextPassword);
      if (authError) setAuthError('');
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setAuthCursorIndex((prev) => Math.max(prev - 1, 0));
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setAuthCursorIndex((prev) => Math.min(prev + 1, 5));
      return;
    }
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    const nextPassword = [...authPassword];
    nextPassword[authCursorIndex] = e.key;
    setAuthPassword(nextPassword);
    if (authCursorIndex < 5) setAuthCursorIndex(authCursorIndex + 1);
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

  const createNote = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newNote: Note = {
      id: Date.now(),
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      author: currentUser!.name,
      date: new Date().toISOString().split('T')[0],
    };
    setTeams((prev) =>
      prev.map((t) =>
        t.id === activeTeamId ? { ...t, notes: [newNote, ...t.notes] } : t,
      ),
    );
    setActiveModal(null);
  };

  // 회의록 수정
  const updateNote = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(`${selectedNote?.id} 회의록을 수정합니다.`);
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

      handleCreateQuickLink(newLinkData.title, newLinkData.content);

      setActiveModal(null);
      setLinkData({ title: '', content: '' });
      alert(`링크가 성공적으로 추가되었습니다.`);
    } catch (error: any) {
      console.log('API 호출 실패 :', error);
      setActiveModal(null);
      alert(error.message || '링크 생성에 실패했습니다.');
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
    } catch (error: any) {
      setActiveModal(null);
      alert(error.message || '링크 삭제에 실패했습니다.');
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

      handleCreateDoc(newDocData.title, newDocData.file);

      setActiveModal(null);
      console.log(docData);
      setDocData({ title: '', file: null });
      alert(`문서가 성공적으로 추가되었습니다.`);
    } catch (error: any) {
      console.log('문서 생성 API 호출 실패 :', error);
      setActiveModal(null);
      alert(error.message || '문서 생성에 실패했습니다.');
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
    } catch (error: any) {
      setActiveModal(null);
      alert(error.message || '문서 삭제에 실패했습니다.');
    }
  };

  const handleLeaveTeam = (teamId: string | number | null) => {
    if (!teamId) return;
    if (
      !window.confirm(
        '정말 이 팀에서 탈퇴하시겠습니까? 다시 입장하려면 비밀번호가 필요합니다.',
      )
    )
      return;
    console.log('탈퇴 시작 - 팀 ID:', teamId);
    setTeams((prevTeams) =>
      prevTeams.map((t) =>
        String(t.id) === String(teamId) ? { ...t, isJoined: false } : t,
      ),
    );
    if (String(activeTeamId) === String(teamId)) {
      setIsTeamAuthorized(false);
      setActiveTeamId(null);
      setView('dashboard');
    }
    setTimeout(() => {
      alert('팀 탈퇴가 완료되었습니다.');
    }, 100);
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

      // API 호출하여 포지션 변경
      const { success } = await editMemberPositionApi(
        Number(activeTeamId),
        editPositionData,
      );

      // 요청이 성공하면 teams 상태 업데이트하기
      handleEditPosition(myPosition);
      console.log('포지션 수정 성공 결과', success);

      // 모달 닫기
      setActiveModal(null);
      alert(`내 포지션이 "${myPosition}" 성공적으로 변경되었습니다.`);
    } catch (error: any) {
      console.log('API 호출 실패 :', error);

      alert(error.message || '포지션 수정에 실패했습니다.');
    } finally {
      setIsPositionPending(false);
    }
  };

  // 공통 로그아웃 처리
  const handleLogout = async () => {
    try {
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
      setShowAuthPassword(false);
      setAuthPage('login');
    } catch (error) {
      console.log(error);
      alert('로그아웃에 실패했습니다.');
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
        setCurrentUser={setCurrentUser}
        goSignup={() => setAuthPage('signup')}
      />
    ) : (
      <Signup goLogin={() => setAuthPage('login')} />
    );
  }

  return (
    <>
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
            view={view}
            setView={setView}
            setIsTeamAuthorized={setIsTeamAuthorized}
            onLogout={handleLogout}
            setActiveTeamId={setActiveTeamId}
            setTeams={setTeams}
            addLog={addLog}
            onLeaveTeam={handleLeaveTeam}
          />
          <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            <Header
              view={view}
              activeTeam={activeTeam!}
              setIsCreateModalOpen={() => setActiveModal('create')}
            />
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              {view === 'dashboard' && activeTeam && (
                <Dashboard
                  activeTeam={activeTeam}
                  setTeams={setTeams}
                  addLog={addLog}
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
                  isAchiveLoading={isArchiveLoading}
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
          <input
            name="teamPassword"
            type="password"
            required
            className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold border border-slate-100 focus:ring-2 focus:ring-blue-500"
            placeholder="비밀번호"
          />
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
                6자리 숫자를 입력해주세요
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
          setNote({ title: '', content: '' });
        }}
        title="회의록 기록"
      >
        <form onSubmit={createNote} className="space-y-6">
          <input
            name="title"
            onChange={(e) => setNote({ ...note, title: e.target.value })}
            required
            className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
            placeholder="회의 제목"
          />
          <textarea
            name="content"
            onChange={(e) => setNote({ ...note, content: e.target.value })}
            required
            rows={8}
            className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none"
            placeholder="내용 입력"
          />
          <button
            type="submit"
            disabled={!isNoteValid}
            className={`w-full py-4 rounded-2xl font-black shadow-lg ${
              isNoteValid
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
          setTeams={setTeams}
          activeTeamId={activeTeamId}
          addLog={addLog}
          handleDeleteTicketApi={handleDeleteTicketApi}
        />
      )}

      {selectedNote && (
        <Modal
          isOpen={!!selectedNote}
          onClose={() => setSelectedNote(null)}
          title={selectedNote.title}
          maxWidth="max-w-2xl"
        >
          <div className="bg-slate-50 p-6 rounded-3xl mb-6">
            <p className="whitespace-pre-wrap text-slate-600 leading-relaxed text-sm">
              {selectedNote.content}
            </p>
          </div>
          <div className="flex justify-between">
            <button
              onClick={() => setActiveModal('updateNote')}
              className="px-4 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold cursor-pointer"
            >
              회의록 수정
            </button>
            <button
              onClick={() => setSelectedNote(null)}
              className="px-4 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold cursor-pointer"
            >
              확인 완료
            </button>
          </div>
        </Modal>
      )}

      <Modal
        isOpen={activeModal === 'updateNote'}
        onClose={() => setActiveModal(null)}
        title="회의록 수정"
      >
        <form onSubmit={updateNote} className="space-y-6">
          <input
            name="title"
            required
            className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
            placeholder="회의 제목"
            defaultValue={selectedNote?.title}
          />
          <textarea
            name="content"
            required
            rows={8}
            className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none"
            placeholder="내용 입력"
            defaultValue={selectedNote?.content}
          />
          <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg">
            수정하기
          </button>
        </form>
      </Modal>
    </>
  );
}
