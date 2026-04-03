import React, { useRef, useEffect } from 'react';
import { X, Clock, ArrowRight, Send } from 'lucide-react';
import type { Ticket, Team, CurrentUser } from '../../types';

interface TicketDetailProps {
  ticket: Ticket;
  activeTeam: Team;
  currentUser: CurrentUser;
  onClose: () => void; // 모달 닫기 함수
  addComment: (e: React.FormEvent<HTMLFormElement>) => void; // 댓글 등록 함수
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  activeTeamId: string | number | null;
  addLog: (ticketId: number, user: string, action: string, type?: 'default' | 'info' | 'success' | 'error') => void;
  handleDeleteTicketApi: (ticketId: number) => Promise<{ ok: boolean; message?: string }>;
}

export const TicketDetail = ({ ticket, currentUser, onClose, addComment, setTeams, activeTeamId, addLog, handleDeleteTicketApi }: TicketDetailProps) => {
  // 스크롤 위치를 잡기 위한 Ref 생성
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 스크롤 하단 이동 함수
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 댓글 데이터가 변경될 때마다 하단 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [ticket.comments]);

  // 권한 체크
  const isWorker = currentUser.name === ticket.worker;

  // 삭제(요청 취소) 핸들러
  const onClickDelete = async () => {
    if (!isWorker) {
      alert("담당자만 요청을 취소할 수 있습니다.");
      return;
    }

    if (!window.confirm("정말 이 요청을 취소하시겠습니까? 취소 시 해당 테스크는 영구적으로 삭제됩니다.")) return;

    try {
      // 1. API 호출
      const result = await handleDeleteTicketApi(Number(ticket.id));
      
      if (result.ok) {
        // 2. 로그 추가
        addLog(
          Number(ticket.id), 
          currentUser.name, 
          `요청 취소: ${ticket.title}`, 
          'error'
        );
        
        // 3. UI 업데이트 (상태 변경)
        setTeams((prevTeams) =>
          prevTeams.map((team) => {
            if (String(team.id) === String(activeTeamId)) {
              return {
                ...team,
                tickets: team.tickets.filter((t) => String(t.id) !== String(ticket.id)),
              };
            }
            return team;
          })
        );

        alert("요청이 성공적으로 취소되어 삭제되었습니다.");
        onClose();
      } else {
        alert(result.message || "삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("삭제 중 에러:", error);
      alert("서버 통신 중 오류가 발생했습니다.");
    }
  };

  return (
    // 고정된 전체 화면 오버레이 (Backdrop)
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] h-[70vh]">

        {/* 헤더 섹션: 제목 및 닫기 버튼 */}
        <header className="p-8 flex justify-between items-start shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-200 shrink-0">
              #{ticket.task_number}
            </div>
            <div className="min-w-0">
              <h3 className="text-2xl font-black text-slate-900 leading-tight truncate">
                {ticket.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  STATUS:
                </span>
                <span className="text-[10px] font-black text-blue-600 uppercase">
                  {ticket.status}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all shrink-0"
          >
            <X size={28} />
          </button>
        </header>

        {/* 바디 섹션: 내용, 담당자 정보, 상태 변경, 댓글 리스트 */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-8 scrollbar-hide min-h-0">
          {/* 업무 설명 박스 */}
          <div className="bg-slate-50/50 p-8 rounded-4xl border border-slate-100">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mb-6">
              <Clock size={12} /> {ticket.createdAt} 발행
            </div>
            <div className="text-sm text-slate-600 leading-relaxed mb-8">
              {ticket.content}
            </div>
            {/* 담당자 정보 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">
                  REQUESTER
                </p>
                <p className="font-black text-slate-800">{ticket.requester}</p>
              </div>
              <ArrowRight size={20} className="text-slate-200 shrink-0" />
              <div className="text-center">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">
                  WORKER
                </p>
                <p className="font-black text-blue-600">{ticket.worker}</p>
              </div>
              {/* 요청 취소(삭제) 버튼 */}
              {/* 담당자일 때만 버튼 활성화, 아닐 때는 비활성화 스타일 적용 */}
              {ticket.status !== 'Done' && ticket.status !== 'Checked' && (
                <div>
                  {isWorker ? (
                    <button
                      onClick={onClickDelete}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[11px] font-black hover:bg-red-100 transition-all cursor-pointer shrink-0"
                    >
                      요청 취소
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 bg-slate-100 text-slate-300 rounded-xl text-[11px] font-black cursor-not-allowed shrink-0"
                    >
                      권한 없음
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 댓글 섹션 */}
          <div className="space-y-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">커뮤니케이션</p>
          
          <div className="space-y-4">
            {ticket.comments.map((c) => {
              // 내가 쓴 글인지 판단하는 변수
              const isMe = c.user === currentUser.name;

              return (
                <div 
                  key={c.id} 
                  className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* 아바타 div 설정 */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                    isMe ? 'bg-blue-600 shadow-md shadow-blue-100' : 'bg-slate-200'
                  }`}>
                    {c.user ? c.user[0] : '?'}
                  </div>

                  {/* 메시지 div 설정 */}
                  <div className={`max-w-[75%] p-4 rounded-2xl text-xs leading-relaxed ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                      : 'bg-slate-50 text-slate-600 rounded-tl-none border border-slate-100'
                  }`}>
                    {/* 내가 쓴 글이 아닐 때만 이름을 표시 */}
                    {!isMe && <p className="text-[9px] font-black mb-1 opacity-60">{c.user}</p>}
                    {c.text}
                  </div>
                </div>
              );
            })}

            {/* 스크롤 하단 이동 지점 */}
            <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* 푸터 섹션: 댓글 입력 폼 */}
        <div className="p-8 border-t border-slate-100 bg-white shrink-0">
          <form onSubmit={addComment} className="relative">
            <input
              name="comment"
              className="w-full bg-slate-100 border-none rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 pr-12"
              placeholder="피드백이나 질문을 남겨주세요..."
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};