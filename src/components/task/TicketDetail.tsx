import React, { useRef, useEffect } from 'react';
import { X, Clock, ArrowRight, Send } from 'lucide-react';
import type { Ticket, Team, CurrentUser } from '../../types';

interface TicketDetailProps {
  ticket: Ticket;
  activeTeam: Team;
  currentUser: CurrentUser;
  onClose: () => void; // 모달 닫기 함수
  addComment: (e: React.FormEvent<HTMLFormElement>) => void; // 댓글 등록 함수
}

export const TicketDetail = ({ ticket, activeTeam, currentUser, onClose, addComment }: TicketDetailProps) => {
  // 스크롤 위치를 잡기 위한 Ref 생성
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 2. 스크롤 하단 이동 함수
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 3. 댓글 데이터(ticket.comments)가 변경될 때마다 함수 실행
  useEffect(() => {
    scrollToBottom();
  }, [ticket.comments]);
  return (
    // 고정된 전체 화면 오버레이 (Backdrop)
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] h-[70vh]">

        {/* 헤더 섹션: 제목 및 닫기 버튼 */}
        <header className="p-8 flex justify-between items-start shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-200 shrink-0">
              #{activeTeam.tickets.indexOf(ticket) + 1}
            </div>
            <div className="min-w-0">
              <h3 className="text-2xl font-black text-slate-900 leading-tight truncate">{ticket.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">STATUS:</span>
                <span className="text-[10px] font-black text-blue-600 uppercase">{ticket.status}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all shrink-0">
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
            <div className="text-sm text-slate-600 leading-relaxed mb-8">{ticket.content}</div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">REQUESTER</p>
                <p className="font-black text-slate-800">{ticket.requester}</p>
              </div>
              <ArrowRight size={20} className="text-slate-200 shrink-0" />
              <div className="text-center">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">WORKER</p>
                <p className="font-black text-blue-600">{ticket.worker}</p>
              </div>
            </div>
          </div>
          

          {/* 댓글 섹션 */}
          <div className="space-y-6"> {/* 간격을 조금 더 넓혔어요 */}
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">커뮤니케이션</p>
          
          <div className="space-y-4">
            {ticket.comments.map((c) => {
              // 1. 내가 쓴 글인지 판단하는 변수
              const isMe = c.user === currentUser.name;

              return (
                <div 
                  key={c.id} 
                  // 2. 내가 쓴 글이면 flex-row-reverse를 적용해 아바타를 오른쪽으로 보냅니다.
                  className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* 아바타: 내 아바타는 파란색으로 강조 */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                    isMe ? 'bg-blue-600 shadow-md shadow-blue-100' : 'bg-slate-200'
                  }`}>
                    {c.user[0]}
                  </div>

                  {/* 메시지 박스: 내 메시지는 말풍선 꼬리 방향을 오른쪽(rounded-tr-none)으로! */}
                  <div className={`max-w-[75%] p-4 rounded-2xl text-xs leading-relaxed ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-sm' // 내 메시지 (파란색)
                      : 'bg-slate-50 text-slate-600 rounded-tl-none border border-slate-100' // 상대방 (회색)
                  }`}>
                    {/* 3. 내가 쓴 글이 아닐 때만 이름을 표시하고 싶다면 추가 (선택 사항) */}
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
            <input name="comment" className="w-full bg-slate-100 border-none rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 pr-12" placeholder="피드백이나 질문을 남겨주세요..." />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all">
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};