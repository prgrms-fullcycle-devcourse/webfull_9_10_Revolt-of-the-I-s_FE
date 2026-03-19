import { useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// 레이아웃 및 페이지
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Lobby } from "./pages/Lobby";
import { Dashboard } from "./pages/Dashboard";
import { Archive } from "./pages/Archive";
import { Members } from "./pages/Members";
import { TicketDetail } from "./components/task/TicketDetail";

// 공통 UI 및 모달
import { Modal } from "./components/ui/Modal";

// 훅 및 타입
import { useTeams } from "./hooks/useTeams";
import type { CurrentUser, Note, Team } from "./types";

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
  const [view, setView] = useState<"dashboard" | "members" | "archive">(
    "dashboard"
  );
  const [isTeamAuthorized, setIsTeamAuthorized] = useState(false);
  const [activeModal, setActiveModal] = useState<
    "create" | "note" | "link" | "createTeam" | "auth" | "position" | null
  >(null);

  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [authPage, setAuthPage] = useState<"login" | "signup">("login");

  // 보안 인증 입력 상태
  const [authPassword, setAuthPassword] = useState<string[]>(Array(6).fill(""));
  const [authError, setAuthError] = useState("");
  const authInputRef = useRef<HTMLInputElement | null>(null);

  // 보안 인증 입력 포커스 상태
  const [isAuthInputFocused, setIsAuthInputFocused] = useState(false);

  // 보안 인증 커서 위치
  const [authCursorIndex, setAuthCursorIndex] = useState(0);

  // 보안 인증 숫자 표시 여부
  const [showAuthPassword, setShowAuthPassword] = useState(false);

  // 6자리 모두 입력됐는지 확인
  const isAuthPasswordComplete = authPassword.every((digit) => digit !== "");

  const selectedTicket =
    activeTeam?.tickets.find((t) => t.id === selectedTicketId) ?? null;

  // --- 브릿지 핸들러 (UI + Data Logic) ---

  // 새 팀 생성 (Lobby 전용)
  const handleCreateTeam = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;

    const formData = new FormData(e.currentTarget);

    const newTeam: Team = {
      id: `team_${Date.now()}`,
      name: formData.get("teamName") as string,
      password: formData.get("teamPassword") as string,
      members: [{ ...currentUser }],
      tickets: [],
      logs: [
        {
          id: Date.now(),
          ticketId: 0,
          user: currentUser.name,
          action: "새 프로젝트 개설",
          time: "현재",
          type: "info",
        },
      ],
      notes: [],
      links: [],
      userStatuses: {
        [currentUser.name]: { label: "활동 중", color: "bg-green-500" },
      },
    };

    setTeams((prev) => [...prev, newTeam]);
    setActiveTeamId(newTeam.id);
    setIsTeamAuthorized(true);
    setActiveModal(null);
    addLog(0, currentUser.name, "새 프로젝트 개설", "info");
  };

  // 새 팀 개설 모달 닫기
  const handleCloseCreateTeamModal = () => {
    setActiveModal(null);
  };

  // 보안 인증 모달 닫기
  const handleCloseAuthModal = () => {
    setActiveModal(null);
    setActiveTeamId(null);
    setAuthPassword(Array(6).fill(""));
    setAuthError("");
    setAuthCursorIndex(0);
    setShowAuthPassword(false);
  };

  // 보안 인증 붙여넣기 처리
  const handleAuthPasswordPaste = (
    e: React.ClipboardEvent<HTMLInputElement>
  ) => {
    e.preventDefault();

    const onlyNumber = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    const nextPassword = Array(6).fill("");
    onlyNumber.split("").forEach((digit, index) => {
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
      setAuthError("");
    }
  };

  // 보안 인증 입력칸 포커스
  const handleFocusAuthInput = () => {
    authInputRef.current?.focus();
  };

  // 보안 인증 클릭한 칸으로 커서 이동
  const handleAuthBoxMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    index: number
  ) => {
    e.preventDefault();
    authInputRef.current?.focus();
    setAuthCursorIndex(index);
  };

  // 보안 인증 숫자/백스페이스 입력 처리
  const handleAuthKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab") return;

    if (e.key === "Backspace") {
      e.preventDefault();

      const nextPassword = [...authPassword];

      // 현재 칸에 값이 있으면 현재 칸만 지움
      if (nextPassword[authCursorIndex] !== "") {
        nextPassword[authCursorIndex] = "";
        setAuthPassword(nextPassword);
      }
      // 현재 칸이 비어있으면 앞 칸만 지움
      else if (authCursorIndex > 0) {
        nextPassword[authCursorIndex - 1] = "";
        setAuthPassword(nextPassword);
        setAuthCursorIndex(authCursorIndex - 1);
      }

      if (authError) {
        setAuthError("");
      }
      return;
    }

    if (e.key === "Delete") {
      e.preventDefault();

      const nextPassword = [...authPassword];
      nextPassword[authCursorIndex] = "";
      setAuthPassword(nextPassword);

      if (authError) {
        setAuthError("");
      }
      return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setAuthCursorIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (e.key === "ArrowRight") {
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
      setAuthError("");
    }
  };

  // 팀 인증 (Lobby 전용)
  const handleTeamAuth = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const team = teams.find((t) => t.id === activeTeamId);
    const authPasswordValue = authPassword.join("");

    if (!team || !isAuthPasswordComplete || authPasswordValue !== team.password) {
      setAuthError("비밀번호가 일치하지 않습니다.");
      return;
    }

    const isAlreadyMember = team.members.some(
      (m) => m.name === currentUser!.name
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
                    label: "방금 입장",
                    color: "bg-green-500",
                  },
                },
              }
            : t
        )
      );
    }

    setIsTeamAuthorized(true);
    setActiveModal(null);
    setAuthPassword(Array(6).fill(""));
    setAuthError("");
    setAuthCursorIndex(0);
    setShowAuthPassword(false);
    addLog(0, currentUser!.name, "공간 입장", "info");
  };

  const createTicket = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 1. FormData 객체 생성
    const formData = new FormData(e.currentTarget);

    // 2. input 태그의 name 속성으로 값을 가져옴
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const worker = formData.get("worker") as string;

    console.log(title, content, worker);

    // 3. 값이 비어있는지 검증 (하나라도 없으면 생성 안 됨)
    if (!title.trim() || !content.trim() || !worker) {
      alert("모든 항목을 입력해주세요.");
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
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      author: currentUser!.name,
      date: new Date().toISOString().split("T")[0],
    };

    setTeams((prev) =>
      prev.map((t) =>
        t.id === activeTeamId ? { ...t, notes: [newNote, ...t.notes] } : t
      )
    );
    setActiveModal(null);
  };

  const createLink = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const newLink = {
      id: Date.now(),
      title: formData.get("title") as string,
      url: formData.get("url") as string,
      type: formData.get("type") as string,
    };

    setTeams((prev) =>
      prev.map((t) =>
        t.id === activeTeamId ? { ...t, links: [newLink, ...t.links] } : t
      )
    );
    setActiveModal(null);
  };

  // --- 조건부 렌더링 (Auth & Lobby) --
  if (!currentUser) {
    return authPage === "login" ? (
      <Login
        setCurrentUser={setCurrentUser}
        goSignup={() => setAuthPage("signup")}
      />
    ) : (
      <Signup goLogin={() => setAuthPage("login")} />
    );
  }

  if (!activeTeamId || !isTeamAuthorized) {
    return (
      <>
        <Lobby
          teams={teams}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          setActiveTeamId={setActiveTeamId}
          setIsTeamAuthorized={setIsTeamAuthorized}
          setIsCreateTeamModalOpen={() => setActiveModal("createTeam")}
          setIsTeamAuthModalOpen={() => setActiveModal("auth")}
        />

        {/* 로비 전용 모달 시스템 */}
        <Modal
          isOpen={activeModal === "createTeam"}
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
          isOpen={activeModal === "auth"}
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
                            {showAuthPassword ? authPassword[index] : "•"}
                          </span>
                          {isCurrentCursor && (
                            <span className="h-6 w-0.5 bg-blue-600 animate-pulse rounded-full" />
                          )}
                        </div>
                      ) : isCurrentCursor ? (
                        <span className="h-6 w-0.5 bg-blue-600 animate-pulse rounded-full" />
                      ) : (
                        ""
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
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
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
        setCurrentUser={setCurrentUser}
        setActiveTeamId={setActiveTeamId}
        setTeams={setTeams}
        addLog={addLog}
      />

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          view={view}
          activeTeam={activeTeam!}
          setIsCreateModalOpen={() => setActiveModal("create")}
        />

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {view === "dashboard" && (
            <Dashboard
              activeTeam={teams.find((t) => t.id === activeTeamId)!}
              setIsCreateModalOpen={() => setActiveModal("create")}
              setSelectedTicketId={setSelectedTicketId}
              updateTicketStatus={updateTicketStatus}
            />
          )}

          {view === "members" && (
            <Members
              activeTeam={activeTeam!}
              updatePosition={() => setActiveModal("position")}
            />
          )}

          {view === "archive" && (
            <Archive
              activeTeam={activeTeam!}
              setIsLinkModalOpen={() => setActiveModal("link")}
              setIsNoteModalOpen={() => setActiveModal("note")}
              setSelectedNote={setSelectedNote}
            />
          )}
        </div>
      </main>

      {/* --- 메인 앱 모달 시스템 --- */}
      <Modal
        isOpen={activeModal === "create"}
        onClose={() => setActiveModal(null)}
        title="새로운 업무 요청"
      >
        <form onSubmit={createTicket} className="space-y-6">
          {/* name="title" 확인 */}
          <input
            name="title"
            required
            className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
            placeholder="제목"
          />
          {/* name="worker" 확인 */}
          <select
            name="worker"
            className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
          >
            <option value="">담당자 선택</option>
            {activeTeam?.members.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
          {/* name="content" 확인 */}
          <textarea
            name="content"
            required
            className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none min-h-37.5"
            placeholder="내용을 입력하세요"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg"
          >
            발행하기
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={activeModal === "note"}
        onClose={() => setActiveModal(null)}
        title="회의록 기록"
      >
        <form onSubmit={createNote} className="space-y-6">
          <input
            name="title"
            required
            className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
            placeholder="회의 주제"
          />
          <textarea
            name="content"
            required
            rows={8}
            className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none"
            placeholder="결정 사항을 기록하세요"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg"
          >
            저장하기
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={activeModal === "link"}
        onClose={() => setActiveModal(null)}
        title="공유 링크 추가"
      >
        <form onSubmit={createLink} className="space-y-6">
          <input
            name="title"
            required
            className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
            placeholder="사이트 이름"
          />
          <input
            name="url"
            type="url"
            required
            className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-mono"
            placeholder="https://..."
          />
          <select
            name="type"
            className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
          >
            <option value="planning">기획</option>
            <option value="dev">개발</option>
            <option value="design">디자인</option>
          </select>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg"
          >
            등록하기
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={activeModal === "position"}
        onClose={() => setActiveModal(null)}
        title="내 포지션 수정"
      >
        <form className="space-y-6">
          <input
            name="title"
            className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
            placeholder="팀원"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg"
          >
            수정하기
          </button>
        </form>
      </Modal>

      {/* 상세 페이지/모달 */}
      {selectedTicket && currentUser && (
        <TicketDetail
          ticket={selectedTicket}
          activeTeam={activeTeam!}
          currentUser={currentUser}
          onClose={() => setSelectedTicketId(null)}
          updateTicketStatus={updateTicketStatus}
          addComment={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleAddComment(
              selectedTicket.id,
              formData.get("comment") as string
            );
            e.currentTarget.reset();
          }}
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
          <button
            onClick={() => setSelectedNote(null)}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold"
          >
            확인 완료
          </button>
        </Modal>
      )}
    </div>
  );
}