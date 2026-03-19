import React from 'react';
import { X, Clock, ArrowRight, Send } from 'lucide-react';
import type { Ticket, Team, CurrentUser } from '../../types';
import { STATUS_TYPES } from '../../utils/constants';

interface TicketDetailProps {
  ticket: Ticket;
  activeTeam: Team;
  currentUser: CurrentUser;
  onClose: () => void; // 모달 닫기 함수
  updateTicketStatus: (id: number, newStatus: string) => void; // 상태 변경 함수
  addComment: (e: React.FormEvent<HTMLFormElement>) => void; // 댓글 등록 함수
}

export const TicketDetail = ({
  ticket,
  activeTeam,
  onClose,
  updateTicketStatus,
  addComment,
}: TicketDetailProps) => {
  return (
    // 고정된 전체 화면 오버레이 (Backdrop)
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* 헤더 섹션: 제목 및 닫기 버튼 */}
        <header className="p-8 flex justify-between items-start shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-200 shrink-0">
              #{activeTeam.tickets.indexOf(ticket) + 1}
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

        {/* 바디 섹션: 내용, 담당자 정보, 상태 변경, 댓글 리스트 (스크롤 가능) */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-8 scrollbar-hide min-h-0">
          {/* 업무 설명 박스 */}
          <div className="bg-slate-50/50 p-8 rounded-4xl border border-slate-100">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mb-6">
              <Clock size={12} /> {ticket.createdAt} 발행
            </div>
            <div className="text-sm text-slate-600 leading-relaxed mb-8">
              {ticket.content}
            </div>
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
            </div>
          </div>

          {/* 진행 상태 변경 섹션 */}
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              진행 상태 변경
            </p>
            <div className="grid grid-cols-2 gap-3">
              {STATUS_TYPES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => updateTicketStatus(ticket.id, s.id)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold text-xs ${ticket.status === s.id ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-lg shadow-blue-100' : 'border-slate-50 bg-slate-50/50 text-slate-400 hover:border-slate-200'}`}
                >
                  <s.icon size={16} className="shrink-0" /> {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 댓글 섹션 */}
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              커뮤니케이션
            </p>
            <div className="space-y-4">
              {ticket.comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {c.user[0]}
                  </div>
                  <div className="flex-1 bg-slate-50 p-4 rounded-2xl rounded-tl-none text-xs text-slate-600 leading-relaxed min-w-0">
                    {c.text}
                  </div>
                </div>
              ))}
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
