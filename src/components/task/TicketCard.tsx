import { Clock, ChevronRight } from 'lucide-react';
import type { Ticket, StatusType, CurrentUser } from '../../types';

interface TicketCardProps {
  ticket: Ticket;
  status: StatusType;
  currentUser: CurrentUser;
  onClick: () => void;
  updateTicketStatus: (
    taskId: number, 
    actionType: 'accept' | 'submit' | 'confirm' | 'reject'
  ) => Promise<{ ok: boolean } | undefined>;
}

export const TicketCard = ({ ticket, status, currentUser, onClick, updateTicketStatus }: TicketCardProps) => {

  // 권한 체크
  const isWorker = String(currentUser?.uuid) === String(ticket.worker_id);
  const isRequester = String(currentUser?.uuid) === String(ticket.requester_id);

  // 현재 버튼 클릭 가능 여부 판단
  let canClickNext = false;
  if (ticket.status === 'Todo' || ticket.status === 'Doing') {
    canClickNext = isWorker;
  } else if (ticket.status === 'Done') {
    canClickNext = isRequester;
  }

  // 비활성화 시 공통 스타일
  const disabledStyle = "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none opacity-60 hover:bg-slate-100 active:scale-100";

  return (
    <div
      onClick={() => {
        onClick();
      }}
      className="bg-white p-5 rounded-[28px] border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group cursor-pointer relative shrink-0"
    >
      <h4 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors mb-2 leading-tight">
        {ticket.title}
      </h4>
      <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
        {ticket.content}
      </p>
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mb-6">
        <Clock size={12} /> {ticket.createdAt}
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="text-[11px] font-bold text-slate-400 min-w-0">
          요청: {ticket.requester} <span className="mx-1 text-slate-200">|</span> 
          <span className="text-blue-600"> 담당: {ticket.worker}</span>
        </div>

        {status.next && (
          <div className="flex gap-1 shrink-0">
            {/* 반려 버튼 */}
            {status.back && (
              <button
                disabled={!isRequester}
                onClick={(e) => {
                  e.stopPropagation();
                  updateTicketStatus(ticket.id, 'reject');
                }}
                className={`px-3 py-1.5 text-[10px] font-black rounded-xl transition-all ${
                  isRequester 
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : disabledStyle
                }`}
              >
                반려
              </button>
            )}
            {/* 단계 별 버튼 (수락/제출/승인) */}
            <button
              disabled={!canClickNext}
              onClick={(e) => {
                e.stopPropagation();

                let action: 'accept' | 'submit' | 'confirm' | 'reject' = 'accept';

                // status별 api 분기
                if (ticket.status === 'Todo') action = 'accept';    // Todo -> 수락하기 -> Doing
                else if (ticket.status === 'Doing') action = 'submit'; // Doing -> 제출하기 -> Done
                else if (ticket.status === 'Done') action = 'confirm'; // Done -> 최종 확인 -> Checked

                updateTicketStatus(ticket.id, action);
              }}
              className={`px-4 py-2 text-[10px] font-black rounded-xl flex items-center gap-1 transition-all ${
                canClickNext 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95"
                  : disabledStyle
              }`}
            >
              {status.nextLabel} <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};