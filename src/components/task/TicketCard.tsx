import { Clock, ChevronRight } from 'lucide-react';
import type { Ticket, StatusType } from '../../types';

interface TicketCardProps {
  ticket: Ticket;
  status: StatusType;
  onClick: (id: number) => void;
  updateTicketStatus: (
    taskId: number, 
    actionType: 'accept' | 'submit' | 'confirm' | 'reject'
  ) => Promise<{ ok: boolean } | undefined>;
}

export const TicketCard = ({ ticket, status, onClick, updateTicketStatus }: TicketCardProps) => {
  return (
    <div
      onClick={() => onClick(ticket.id)}
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
                onClick={(e) => {
                  e.stopPropagation();
                  updateTicketStatus(ticket.id, 'reject');
                }}
                className="px-3 py-1.5 bg-red-50 text-red-600 text-[10px] font-black rounded-xl hover:bg-red-100 transition-all"
              >
                반려
              </button>
            )}
            {/* 단계 별 버튼 (수락/제출/승인) */}
            <button
              onClick={(e) => {
                e.stopPropagation();

                let action: 'accept' | 'submit' | 'confirm' | 'reject' = 'accept';

                // status별 api 분기
                if (ticket.status === 'Todo') action = 'accept';    // Todo -> 수락하기 -> Doing
                else if (ticket.status === 'Doing') action = 'submit'; // Doing -> 제출하기 -> Done
                else if (ticket.status === 'Done') action = 'confirm'; // Done -> 최종 확인 -> Checked

                updateTicketStatus(ticket.id, action);
              }}
              className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 flex items-center gap-1 active:scale-95 transition-all"
            >
              {status.nextLabel} <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};