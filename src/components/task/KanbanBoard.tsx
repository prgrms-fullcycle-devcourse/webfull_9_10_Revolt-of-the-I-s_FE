import type { Ticket, StatusType, CurrentUser } from '../../types';
import { TicketCard } from './TicketCard';

interface KanbanColumnProps {
  status: StatusType; // 컬럼의 상태 정보 (ID, 라벨, 아이콘, 색상 등 포함)
  tickets: Ticket[]; // 이 컬럼의 상태와 일치하도록 부모(Dashboard)에서 필터링되어 넘어온 티켓들
  currentUser: CurrentUser;
  onTicketClick: (id: number) => void; // 티켓 클릭 시 상세 모달을 띄우기 위한 핸들러
  updateTicketStatus: (
    taskId: number, 
    actionType: 'accept' | 'submit' | 'confirm' | 'reject'
  ) => Promise<{ ok: boolean } | undefined>; // 티켓 상태 변경(반려 포함) 로직
}

export const KanbanColumn = ({ status, tickets, currentUser, onTicketClick, updateTicketStatus }: KanbanColumnProps) => {
  // 상태 정보에서 아이콘 컴포넌트를 추출
  const Icon = status.icon;

  return (
    <div className="flex-1 flex flex-col min-w-70 max-w-90">
      {/* 컬럼 헤더: 상태 아이콘, 이름, 그리고 해당 상태의 티켓 개수 표시 */}
      <div className="flex items-center justify-between p-4 mb-4 bg-white rounded-2xl shadow-sm border border-slate-100 shrink-0">
        <div className="flex items-center gap-2 font-black text-slate-800">
          <Icon size={20} className={status.color} /> {status.label}
        </div>
        <span className="w-6 h-6 bg-slate-50 text-slate-400 text-[10px] font-black rounded-full flex items-center justify-center">
          {tickets.length}
        </span>
      </div>

      {/* 티켓 리스트 영역 */}
      <div className="flex-1 space-y-4 overflow-y-auto pb-4 scrollbar-hide min-h-0">
        {/* 해당 컬럼의 모든 티켓을 카드로 렌더링 */}
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            currentUser={currentUser}
            ticket={ticket}
            status={status}
            onClick={() => onTicketClick(ticket.id)}
            updateTicketStatus={updateTicketStatus}
          />
        ))}
      </div>
    </div>
  );
};