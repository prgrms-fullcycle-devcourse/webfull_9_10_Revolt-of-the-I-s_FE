import { useState } from "react";

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

  const selectedTicket =
    activeTeam?.tickets.find((t) => t.id === selectedTicketId) ?? null;

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

  const handleTeamAuth = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const team = teams.find((t) => t.id === activeTeamId);
    const password = (
      e.currentTarget.elements.namedItem("password") as HTMLInputElement
    ).value;

    if (!team || password !== team.password) {
      alert("비밀번호가 틀렸습니다.");
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
    addLog(0, currentUser!.name, "공간 입장", "info");
  };

  const createTicket = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const worker = formData.get("worker") as string;

    if (!title.trim() || !content.trim() || !worker) {
      alert("모든 항목을 입력해주세요.");
      return;
    }

    handleCreateTicket(title, content, worker);
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

        <Modal
          isOpen={activeModal === "createTeam"}
          onClose={() => setActiveModal(null)}
          title="새 프로젝트 개설"
        >
          <form onSubmit={handleCreateTeam} className="space-y-6">
            <input
              name="teamName"
              required
              className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
              placeholder="팀 이름"
            />
            <input
              name="teamPassword"
              type="password"
              required
              className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
              placeholder="비밀번호"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl shadow-xl hover:bg-blue-700 transition-all"
            >
              생성 및 입장
            </button>
          </form>
        </Modal>

        <Modal
          isOpen={activeModal === "auth"}
          onClose={() => {
            setActiveModal(null);
            setActiveTeamId(null);
          }}
          title="보안 인증"
        >
          <div className="mb-8 text-center">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              비밀번호를 입력하세요
            </p>
          </div>
          <form onSubmit={handleTeamAuth} className="space-y-8">
            <input
              name="password"
              type="password"
              required
              autoFocus
              className="w-full bg-slate-50 rounded-3xl px-8 py-5 text-center text-3xl font-black tracking-[0.5em] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
              placeholder="••••"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl shadow-xl hover:bg-blue-700 transition-all"
            >
              인증 및 입장
            </button>
          </form>
        </Modal>
      </>
    );
  }

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

      <Modal
        isOpen={activeModal === "create"}
        onClose={() => setActiveModal(null)}
        title="새로운 업무 요청"
      >
        <form onSubmit={createTicket} className="space-y-6">
          <input
            name="title"
            required
            className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
            placeholder="제목"
          />
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