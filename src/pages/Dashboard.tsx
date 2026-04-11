import type { CurrentUser, Member, Team } from '../types';
import { STATUS_TYPES } from '../utils/constants';
import { KanbanColumn } from '../components/task/KanbanBoard';
import { createTicketApi, type CreateTicketRequest } from '../api/tickets';
import { Modal } from '../components/ui/Modal';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface DashboardProps {
  activeTeam: Team;
  activeTeamId: string | number | null;
  currentUser: CurrentUser;
  setSelectedTicketId: (id: number) => void; 
  updateTicketStatus: (
    taskId: number, 
    actionType: 'accept' | 'submit' | 'confirm' | 'reject'
  ) => Promise<{ ok: boolean } | undefined>;
  activeModal: string | null; 
  setActiveModal: React.Dispatch<React.SetStateAction<'create' | 'note' | 'link' | 'createTeam' | 'auth' | 'position' | 'document' | 'updateNote' | 'deleteLink' | null>>;
}

export const Dashboard = ({
  activeTeam,
  activeTeamId,
  currentUser,
  setSelectedTicketId,
  updateTicketStatus,
  activeModal,
  setActiveModal,
}: DashboardProps) => {
  const queryClient = useQueryClient();

  const closeCreateModal = () => setActiveModal(null);

  // member 데이터 가공
  const membersWithUuid =
    activeTeam?.members.map((m: Member) => ({
      uuid: m.uuid || String(m.id),
      name: m.name || 'Unknown',
    })) || [];

  // 담당자 변경 핸들러
  const handleWorkerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUuid = e.target.value;
    const selectedMember = membersWithUuid.find((m) => m.uuid === selectedUuid);
    if (selectedMember) {
      console.log('담당자 선택 :', selectedMember.name);
    }
  };

  // 테스크 생성 API 핸들러
  const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!activeTeamId) return;

    try {
      const formData = new FormData(form);
      const selectedWorkerUuid = formData.get('worker_id') as string;

      const ticketData: CreateTicketRequest = {
        title: formData.get('title') as string,
        content: formData.get('content') as string,
        worker_id: selectedWorkerUuid,
      };

      // api 호출
      await createTicketApi(Number(activeTeamId), ticketData);
      // 서버 데이터 무효화
      queryClient.invalidateQueries({ queryKey: ['tickets', activeTeamId] });
      setActiveModal(null);
      form.reset();
    } catch (error) {
      console.error('티켓 생성 실패:', error);
      alert('업무 요청 중 오류가 발생했습니다.');
    }
  };

  // 실시간 감시용 = 티켓이 추가되면 로그 숫자가 변경되어야 함
  useEffect(() => {
    console.log('현재 티켓 수:', activeTeam.tickets.length);
  }, [activeTeam.tickets]);

  const CreateTicketModal = (
    <Modal
      isOpen={activeModal === 'create'}
      onClose={closeCreateModal}
      title="새로운 업무 요청"
    >
      <form onSubmit={handleCreateTicket} className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase">
            업무 타이틀
          </label>
          <input
            name="title"
            required
            className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold"
            placeholder="업무 핵심 주제"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase">
            담당자 선택
          </label>
          <div className="relative">
            <select
              name="worker_id"
              required
              onChange={handleWorkerChange}
              className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold cursor-pointer appearance-none"
            >
              <option value="">담당자를 선택해주세요</option>
              {membersWithUuid?.map((m) => (
                <option key={m.uuid} value={m.uuid}>
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
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase">
            요청 상세 내용
          </label>
          <textarea
            name="content"
            required
            className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none min-h-37.5 font-bold"
            placeholder="수정 사항을 상세히 입력하세요."
          />
        </div>
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={closeCreateModal}
            className="flex-1 bg-slate-100 py-4 rounded-2xl font-bold"
          >
            취소
          </button>
          <button
            type="submit"
            className="flex-2 bg-blue-600 text-white py-4 rounded-2xl font-black cursor-pointer"
          >
            요청 발행 (Todo)
          </button>
        </div>
      </form>
    </Modal>
  );

  return (
    <>
      <div className="h-full w-full">
        {/* 조건부 렌더링: activeTeam.tickets.length를 직접 참조 */}
        {activeTeam.tickets.length === 0 ? (
          <div className="h-full w-full flex flex-col items-center justify-center p-8">
            <p className="text-slate-400 font-medium text-2xl mb-10 text-center whitespace-pre-wrap">
              {'팀원들과 빠르게 \n 업무 요청을 해보세요!'}
            </p>
            <button
              onClick={() => setActiveModal('create')}
              className="bg-blue-600 text-white px-30 py-5 rounded-4xl font-black text-xl"
            >
              새 요청
            </button>
          </div>
        ) : (
          <div className="flex gap-6 h-full min-w-300">
            {STATUS_TYPES.map((status) => {
              const filteredTickets = activeTeam.tickets.filter(
                (t) =>
                  String(t.status).toLowerCase() ===
                  String(status.id).toLowerCase(),
              );
              return (
                <KanbanColumn
                  key={status.id}
                  status={status}
                  currentUser={currentUser}
                  tickets={filteredTickets}
                  onTicketClick={setSelectedTicketId}
                  updateTicketStatus={updateTicketStatus}
                />
              );
            })}
          </div>
        )}
      </div>
      {CreateTicketModal}
    </>
  );
};
