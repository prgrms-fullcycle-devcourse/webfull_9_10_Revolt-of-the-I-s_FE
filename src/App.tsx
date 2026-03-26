import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { logoutApi } from './api/auth';

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
  type Team,
  type TeamLink,
} from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // --- 데이터 로직 (Custom Hook) ---
  const {
    teams,
    setTeams,
    activeTeamId,
    setActiveTeamId,
    activeTeam,
    updateTicketStatus,
    handleCreateTicket,
    handleAddComment,
    addLog,
  } = useTeams(currentUser);

  // --- UI 상태 관리 ---
  const [view, setView] = useState<'dashboard' | 'members' | 'archive'>(
    'dashboard',
  );
  const [isTeamAuthorized, setIsTeamAuthorized] = useState(false);
  const [activeModal, setActiveModal] = useState<
    | 'create'
    | 'note'
    | 'link'
    | 'createTeam'
    | 'auth'
    | 'position'
    | 'document'
    | 'updateNote'
    | 'deleteLinks'
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
  const [position, setPosition] = useState<{ title: string }>({ title: '' });
  const isPositionValid = position.title.length > 0;

  // 링크, 문서 관련 상태
  const [linkData, setLinkData] = useState<{ title: string; url: string }>({
    title: '',
    url: '',
  });
  const isLinkValid = linkData.title.length > 0 && linkData.url.length > 0;
  const [selectedLinkToDelete, setLinkToDelete] = useState<TeamLink | null>(
    null,
  );
  const [docData, setDocData] = useState<{ title: string; file: File | null }>({
    title: '',
    file: null,
  });
  const isDocValid = docData.title.length > 0 && docData.file !== null;
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // 로그아웃 API 호출
  const logoutMutation = useMutation({mutationFn: logoutApi,});

  // --- 브릿지 핸들러 (UI + Data Logic) ---

  // 새 팀 생성 (Lobby 전용)
  const handleCreateTeam = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;

    const formData = new FormData(e.currentTarget);

    const newTeam: Team = {
      id: `team_${Date.now()}`,
      name: formData.get('teamName') as string,
      password: formData.get('teamPassword') as string,
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
    setIsTeamAuthorized(true);
    setActiveModal(null);
    addLog(0, currentUser.name, '새 프로젝트 개설', 'info');
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

    // 마지막 입력 칸으로 커서 이동
    if (onlyNumber.length === 0) {
      setAuthCursorIndex(0);
    } else if (onlyNumber.length >= 6) {
      setAuthCursorIndex(5);
    } else {
      setAuthCursorIndex(onlyNumber.length);
    }

    if (authError) {
      setAuthError('');
    }
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

      // 현재 칸에 값이 있으면 현재 칸만 지움
      if (nextPassword[authCursorIndex] !== '') {
        nextPassword[authCursorIndex] = '';
        setAuthPassword(nextPassword);
      }
      // 현재 칸이 비어있으면 앞 칸만 지움
      else if (authCursorIndex > 0) {
        nextPassword[authCursorIndex - 1] = '';
        setAuthPassword(nextPassword);
        setAuthCursorIndex(authCursorIndex - 1);
      }

      if (authError) {
        setAuthError('');
      }
      return;
    }

    if (e.key === 'Delete') {
      e.preventDefault();

      const nextPassword = [...authPassword];
      nextPassword[authCursorIndex] = '';
      setAuthPassword(nextPassword);

      if (authError) {
        setAuthError('');
      }
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

    // 현재 커서 위치 숫자만 바꿈
    nextPassword[authCursorIndex] = e.key;
    setAuthPassword(nextPassword);

    // 다음 칸으로 커서 이동
    if (authCursorIndex < 5) {
      setAuthCursorIndex(authCursorIndex + 1);
    }

    if (authError) {
      setAuthError('');
    }
  };

  // 팀 인증 (Lobby 전용)
  const handleTeamAuth = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const team = teams.find((t) => t.id === activeTeamId);

    const authPasswordValue = authPassword.join('');

    if (
      !team ||
      !isAuthPasswordComplete ||
      authPasswordValue !== team.password
    ) {
      setAuthError('비밀번호가 일치하지 않습니다.');

      return;
    }

    const isAlreadyMember = team.members.some(
      (m) => m.name === currentUser!.name,
    );

    if (!isAlreadyMember) {
      setTeams((prev) =>
        prev.map((t) =>
          t.id === activeTeamId
            ? {
                ...t,
                members: [...t.members, currentUser!],
                userStatuses: {
                  ...t.userStatuses,
                  [currentUser!.name]: {
                    label: '방금 입장',
                    color: 'bg-green-500',
                  },
                },
              }
            : t,
        ),
      );
    }

    setIsTeamAuthorized(true);
    setActiveModal(null);

    setAuthPassword(Array(6).fill(''));
    setAuthError('');
    setAuthCursorIndex(0);
    setShowAuthPassword(false);
    addLog(0, currentUser!.name, '공간 입장', 'info');
  };

  const createTicket = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 1. FormData 객체 생성
    const formData = new FormData(e.currentTarget);

    // 2. input 태그의 name 속성으로 값을 가져옴
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const worker = formData.get('worker') as string;

    console.log(title, content, worker);

    // 3. 값이 비어있는지 검증 (하나라도 없으면 생성 안 됨)
    if (!title.trim() || !content.trim() || !worker) {
      alert('모든 항목을 입력해주세요.');
      return;
    }

    // 4. 훅에서 가져온 함수 호출 (인자 순서 확인!)
    handleCreateTicket(title, content, worker);

    // 5. 모달 닫기
    setActiveModal(null);
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
    // 기능 개발 추후
    e.preventDefault();
    console.log(`${selectedNote?.id} 회의록을 수정합니다.`);
    // 회의록 수정 api 호출
    // setSelectedNote 실행하여 selectedNote 상태값 반영
    // 모달 닫기
  };

  const createLink = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const newLink = {
      id: Date.now(),
      title: formData.get('title') as string,
      url: formData.get('url') as string,
      type: formData.get('type') as string,
    };

    setTeams((prev) =>
      prev.map((t) =>
        t.id === activeTeamId ? { ...t, links: [newLink, ...t.links] } : t,
      ),
    );
    setActiveModal(null);
  };

  const deleteLink = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log(`${selectedLinkToDelete?.id}의 링크를 삭제합니다.`);
    // 삭제 api 호출
    // 성공, 실패 시 분기 처리
    // 성공 시 filter로 ui 제거 후 상태값 변경
  };

  const handleLeaveTeam = (teamId: string | number | null) => {
    if (!teamId) return;

    if (
      !window.confirm(
        '정말 이 팀에서 탈퇴하시겠습니까? 다시 입장하려면 비밀번호가 필요합니다.',
      )
    )
      return;

    console.log('탈퇴 시작 - 팀 ID:', teamId); // 디버깅용 로그

    // 전체 팀 목록에서 해당 팀의 '참여 상태'만 업데이트
    // (참여 중인 팀 목록은 보통 t.isJoined === true 인 것들만 필터링해서 보여주고 계실 거예요)
    setTeams((prevTeams) =>
      prevTeams.map((t) =>
        // t.id와 teamId의 타입을 강제로 맞춰서 비교합니다.
        String(t.id) === String(teamId) ? { ...t, isJoined: false } : t,
      ),
    );

    // 현재 활성화된 팀일 경우 로비로 튕겨내기
    if (String(activeTeamId) === String(teamId)) {
      console.log('로비로 이동 중...');
      setIsTeamAuthorized(false);
      setActiveTeamId(null);
      // 뷰를 대시보드나 로비로 전환 (필요시 추가)
      setView('dashboard');
    }

    // 알림창은 모든 처리가 끝난 후 띄우기
    setTimeout(() => {
      alert('팀 탈퇴가 완료되었습니다.');
    }, 100);
  };

  // 포지션 수정
  const updatePosition = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(`${selectedMember?.position}을 수정합니다.`);
  };

  // --- 조건부 렌더링 (Auth & Lobby) --
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

  // 공통 로그아웃 처리
  const handleLogout = async () => {
    try {
      const data = await logoutMutation.mutateAsync()

      // 로그아웃 성공이 아니면 실패 메시지 출력 후 종료
      if (!data.success) {
        alert(data.error || '로그아웃에 실패했습니다.')
        return
      }

      // 서버에서 성공 메시지를 주면 한 번만 표시
      if (data.data?.message) {
        alert(data.data.message)
      } else {
        alert('로그아웃 되었습니다.')
      }

      // 로그아웃 성공했을 때만 프론트 상태 초기화
      // localStorage.removeItem('accessToken')
      setCurrentUser(null)
      setActiveTeamId(null)
      setIsTeamAuthorized(false)
      setActiveModal(null)

      // 보안 인증 관련 상태도 초기화
      setAuthPassword(Array(6).fill(''))
      setAuthError('')
      setAuthCursorIndex(0)
      setShowAuthPassword(false)

      // 로그인 화면으로 돌리기
      setAuthPage('login')
    } catch (error) {
      console.log(error)
      alert('로그아웃에 실패했습니다.')
    }
  }

  if (!activeTeamId || !isTeamAuthorized) {
    return (
      <>
        <Lobby
          teams={teams}
          currentUser={currentUser}
          onLogout={handleLogout}
          setActiveTeamId={setActiveTeamId}
          setIsTeamAuthorized={setIsTeamAuthorized}
          setIsCreateTeamModalOpen={() => setActiveModal('createTeam')}
          setIsTeamAuthModalOpen={() => setActiveModal('auth')}
        />

        {/* 로비 전용 모달 시스템 */}
        <Modal
          isOpen={activeModal === 'createTeam'}
          onClose={handleCloseCreateTeamModal}
          title="새 팀 개설"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCreateTeam} className="space-y-4">
            {/* 팀 이름 입력 */}
            <input
              name="teamName"
              required
              minLength={2}
              maxLength={30}
              className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold border border-slate-100 focus:ring-2 focus:ring-blue-500"
              placeholder="팀 이름"
            />

            {/* 비밀번호 입력 */}
            <input
              name="teamPassword"
              type="password"
              required
              className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none font-bold border border-slate-100 focus:ring-2 focus:ring-blue-500"
              placeholder="비밀번호"
            />

            {/* 팀 생성 버튼 */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-blue-700 transition-all"
            >
              팀 생성 및 입장
            </button>

            {/* 취소 버튼 */}
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
            {/* 안내 문구 */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  비밀번호를 입력하세요
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  6자리 숫자를 입력해주세요
                </p>
              </div>

              {/* 비밀번호 보기/숨기기 버튼 */}
              <button
                type="button"
                onClick={() => setShowAuthPassword((prev) => !prev)}
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
                {showAuthPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <form onSubmit={handleTeamAuth} className="space-y-4">
              {/* 실제 입력용 숨김 input */}
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

              {/* PIN 입력 UI */}
              <div
                onClick={handleFocusAuthInput}
                className="grid grid-cols-6 gap-2 cursor-text"
              >
                {Array.from({ length: 6 }).map((_, index) => {
                  // 현재 커서 위치 표시
                  const isCurrentCursor =
                    isAuthInputFocused && index === authCursorIndex;

                  return (
                    <div
                      key={index}
                      onMouseDown={(e) => handleAuthBoxMouseDown(e, index)}
                      className="h-12 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center text-lg font-black text-slate-700"
                    >
                      {/* 입력된 값은 보기 상태에 따라 숫자/점으로 표시 */}
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

              {/* 인증 버튼 */}
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

              {/* 에러 문구 */}
              {authError && (
                <p className="text-sm font-bold text-red-500 text-center">
                  {authError}
                </p>
              )}
            </form>
          </div>
        </Modal>
      </>
    );
  }

  // --- 메인 레이아웃 (인증 완료 후) ---
  return (
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
          {view === 'dashboard' && (
            <Dashboard
              activeTeam={teams.find((t) => t.id === activeTeamId)!}
              setIsCreateModalOpen={() => setActiveModal('create')}
              setSelectedTicketId={setSelectedTicketId}
              updateTicketStatus={updateTicketStatus}
            />
          )}

          {view === 'members' && (
            <Members
              activeTeam={activeTeam!}
              currentUser={currentUser}
              updatePosition={(member: Member) => {
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
              setIsDeleteLinkModalOpen={(link: TeamLink) => {
                setActiveModal('deleteLinks');
                setLinkToDelete(link);
              }}
              setSelectedNote={(note) => setSelectedNote(note)}
            />
          )}
        </div>
      </main>

      {/* --- 새 요청 발행 모달 --- */}
      <Modal
        isOpen={activeModal === 'create'}
        onClose={() => setActiveModal(null)}
        title="새로운 업무 요청"
      >
        <form onSubmit={createTicket} className="space-y-6">
          {/* 업무 타이틀 작성 영역 */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-wider">
              업무 타이틀
            </label>
            <input
              name="title"
              required
              className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
              placeholder="업무 핵심 주제"
            />
          </div>
          {/* 담당자 선택 영역 */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-wider">
              담당자 선택
            </label>
            <div className="relative">
              <select
                name="worker"
                className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-[16px] text-slate-600 cursor-pointer appearance-none transition-all"
              >
                <option value="">담당자 선택</option>
                {activeTeam?.members.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>

              {/* 화살표 커스텀 */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.5 4.5L6 8L9.5 4.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
          {/* 상세 내용 영역 */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-wider">
              상세 내용
            </label>
            <textarea
              name="content"
              required
              className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none min-h-37.5 font-bold"
              placeholder="수정 사항을 상세히 입력하세요."
            />

            {/* 버튼 영역 */}
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold hover:bg-slate-200 active:scale-[0.98] transition-all cursor-pointer"
              >
                취소
              </button>

              <button
                type="submit"
                className="flex-2 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer"
              >
                요청 발행 (Todo)
              </button>
            </div>
          </div>
        </form>
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
            onChange={(e) => {
              setNote({ ...note, title: e.target.value });
            }}
            required
            className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
            placeholder="회의 제목"
          />
          <textarea
            name="content"
            onChange={(e) => {
              setNote({ ...note, content: e.target.value });
            }}
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
          setLinkData({ title: '', url: '' });
        }}
        title="공유 링크 추가"
      >
        <form onSubmit={createLink} className="space-y-6">
          <input
            name="title"
            onChange={(e) => {
              setLinkData({ ...linkData, title: e.target.value });
            }}
            required
            className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
            placeholder="사이트 이름"
          />
          <input
            name="url"
            onChange={(e) => {
              setLinkData({ ...linkData, url: e.target.value });
            }}
            type="url"
            required
            className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-mono"
            placeholder="https://..."
          />

          <button
            type="submit"
            disabled={!isLinkValid}
            className={`w-full py-4 rounded-2xl font-black shadow-lg transition-colors ${
              isLinkValid
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
        <form onSubmit={createLink} className="space-y-6">
          <input
            name="title"
            required
            onChange={(e) => {
              setDocData({ ...docData, title: e.target.value });
            }}
            className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold "
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
          {/* input file 커스텀 ui */}
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
                <Trash2 className=" text-slate-500 group-hover:text-red-400" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="file-upload"
              className="block w-full px-6 py-4 bg-slate-50 font-bold rounded-2xl hover:bg-slate-200 outline-none cursor-pointer"
            >
              <span className="">pdf 파일 첨부</span>
            </label>
          )}

          <button
            type="submit"
            disabled={!isDocValid}
            className={`w-full py-4 rounded-2xl font-black shadow-lg transition-colors ${
              isDocValid
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
        onClose={() => setActiveModal(null)}
        title="내 포지션 수정"
      >
        <form
          className="space-y-6"
          onSubmit={(e) => {
            updatePosition(e);
          }}
        >
          <input
            name="title"
            className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
            placeholder="팀원"
            defaultValue={selectedMember?.position}
            onChange={(e) => {
              setPosition({ ...position, title: e.target.value });
            }}
          />
          <button
            type="submit"
            disabled={!isPositionValid}
            className={`w-full py-4 rounded-2xl font-black shadow-lg transition-colors ${
              isPositionValid
                ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            수정하기
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={activeModal === 'deleteLinks'}
        onClose={() => setActiveModal(null)}
        title={`${selectedLinkToDelete?.type === 'links' ? '퀵 링크' : '문서'}를 삭제하시겠어요?`}
      >
        <div className="flex justify-between items-center gap-2">
          <button
            className=" bg-red-100 w-full hover:bg-red-200 text-red-500 px py-3 rounded-2xl font-black shadow-lg cursor-pointer"
            onClick={(e) => deleteLink(e)}
          >
            삭제하기
          </button>
          <button
            className=" bg-slate-600 w-full hover:bg-slate-700 text-white py-3 rounded-2xl font-black shadow-lg cursor-pointer "
            onClick={() => setActiveModal(null)}
          >
            취소
          </button>
        </div>
      </Modal>
      {/* 상세 페이지/모달 */}
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
              className=" px-4 py-4  bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold cursor-pointer "
            >
              회의록 수정
            </button>
            <button
              onClick={() => setSelectedNote(null)}
              className=" px-4 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold cursor-pointer "
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
        <form
          onSubmit={(e) => {
            updateNote(e);
          }}
          className="space-y-6"
        >
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
    </div>
  );
}
