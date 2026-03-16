import type { Team } from '../types';
import { STATUS_TYPES } from '../utils/constants';
import { KanbanColumn } from '../components/task/KanbanBoard';

interface DashboardProps {
  activeTeam: Team; // 현재 선택된 팀의 데이터
  setIsCreateModalOpen: () => void; // 새 티켓 모달 오픈
  setSelectedTicketId: (id: number) => void; // 특정 티켓 선택(상세보기)
  updateTicketStatus: (id: number, newStatus: string, isReject?: boolean) => void; // 상태 변경
}

export const Dashboard = ({ 
  activeTeam, 
  setIsCreateModalOpen, 
  setSelectedTicketId, 
  updateTicketStatus 
}: DashboardProps) => {
  return (
    <div className="flex gap-6 h-full min-w-300">
      {/* 
        상수(STATUS_TYPES)를 순회하며 3개의 기둥(Todo, Doing, Done)을 생성합니다.
        각 기둥에는 해당 상태의 티켓들만 필터링하여 전달합니다.
      */}
      {STATUS_TYPES.map((status) => {
        // 해당 상태에 맞는 티켓들만 필터링
        const filteredTickets = activeTeam.tickets.filter((t) => t.status === status.id);
        
        return (
          <KanbanColumn
            key={status.id}
            status={status}
            tickets={filteredTickets}
            onTicketClick={setSelectedTicketId}
            onAddTicketClick={setIsCreateModalOpen}
            updateTicketStatus={updateTicketStatus}
          />
        );
      })}
    </div>
  );
};