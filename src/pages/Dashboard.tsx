import type { CurrentUser, Team } from '../types';
import { STATUS_TYPES } from '../utils/constants';
import { KanbanColumn } from '../components/task/KanbanBoard';
import { createTicketApi, type CreateTicketRequest } from '../api/tickets';
import { Modal } from '../components/ui/Modal'

interface DashboardProps {
  activeTeam: Team; // 현재 선택된 팀의 데이터
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  addLog: (ticketId: number, user: string, action: string, type?: any) => void;
  activeTeamId: string | number | null;
  currentUser: CurrentUser;
  
   // 새 티켓 모달 오픈
  setSelectedTicketId: (id: number) => void; // 특정 티켓 선택(상세보기)
  updateTicketStatus: (id: number, newStatus: string, isReject?: boolean) => void; // 상태 변경

  // app.tsx에서 모달 상태 받기
  activeModal: string | null; 
  setActiveModal: React.Dispatch<React.SetStateAction<any>>;
}

export const Dashboard = ({ 
  activeTeam, 
  setTeams, 
  addLog, 
  currentUser,
  setSelectedTicketId, 
  updateTicketStatus,
  activeModal,
  setActiveModal
}: DashboardProps) => {
  const isCreateModalOpen = activeModal === 'create';

  const closeCreateModal = () => setActiveModal(null);

// -- Task 생성 api 호출 및 응답 함수 --
const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault(); // 페이지 새로고침 방지
  console.log("--- 🚀 업무 생성 프로세스 시작 ---");

  try {
    const formData = new FormData(e.currentTarget);
    const selectedId = formData.get('worker_id'); 
    
    // 1. 선택된 담당자 찾기
    const selectedMember = membersWithId?.find(
      (m) => String(m.id) === String(selectedId)
    );

    const tempTeamId = Number(activeTeam) || 11; 
    console.log("teamId:", tempTeamId);

    if (!selectedMember) {
      alert("담당자를 선택해주세요.");
      return;
    }
  
    // api로 전송할 최종 데이터 정의
    const ticketData: CreateTicketRequest = {
        title: formData.get('title') as string,
        content: formData.get('content') as string,
        worker_id: '7aa4d04a-41d2-4144-a00c-b3d40bfa84f7',
      };

      console.log("전송할 Ticket Data:", ticketData);
      console.log(" API 호출 시도 중...");

      const newTicket = await createTicketApi(Number(tempTeamId), ticketData);

      console.log("API 호출 성공! 응답 데이터:", newTicket);
      console.log("tempTeamId:", tempTeamId);

      setTeams((prev: Team[]) => {
        console.log("현재 전체 팀 목록(prev):", prev);
        
        return prev.map(team => {
          const isTargetTeam = String(team.id) === String(tempTeamId);
          console.log(`팀 비교 체크: 대상ID(${tempTeamId}) == 현재ID(${team.id}) -> ${isTargetTeam}`);

          if (isTargetTeam) {
            // 서버 응답 데이터 구조 확인
            console.log("서버에서 온 원본 newTicket:", newTicket);

            const ticketWithStatus = {
              ...newTicket,
              status: newTicket?.status || 'Todo' 
            };

            console.log('UI에 추가될 최종 티켓 객체:', ticketWithStatus);

            const updatedTeam = {
              ...team,
              tickets: [...(team.tickets || []), ticketWithStatus]
            };
            
            console.log('업데이트된 팀 객체:', updatedTeam);
            return updatedTeam;
          }
          return team;
        });
      });
      console.log('setTeams 실행 명령 완료');

        // 로그 추가 및 응답 처리
        addLog(
          newTicket.id, 
          currentUser.name, 
          `새 업무 요청: ${newTicket.data.title}`,
          'success'
        );

        console.log('프로세스 완료');
        closeCreateModal();
        alert("업무가 성공적으로 요청되었습니다!");
      } catch (error) {
        console.error("티켓 생성 실패:", error);
        alert("업무 요청 중 오류가 발생했습니다.");
      }
    };

// 원본 데이터에 가짜 ID를 입힌 "새로운 리스트"를 생성
  const membersWithId = activeTeam?.members.map((m, index) => ({
    ...m,
    id: m.id || index + 1, // 실제 ID가 없으면 1, 2, 3... 부여
  }));

  // 담당자 선택 시 실행 함수
  const handleWorkerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value; 
    
    const selectedMember = membersWithId?.find((m) => String(m.id) === String(selectedId));

    if (selectedMember) {
      console.log("--- 🕵️ 담당자 선택 정보 ---");
      console.log(`선택된 ID: ${selectedMember.id}`);
      console.log(`선택된 이름: ${selectedMember.name}`);
      console.log("------------------------");
    } else {
      console.log("❌ 해당 ID와 일치하는 멤버를 찾을 수 없습니다.");
      console.log("현재 목록 상태:", membersWithId);
    }
  };

  // 전체 티켓이 하나도 없는지 확인
  const isEmpty = activeTeam.tickets.length === 0;

  const CreateTicketModal = (
    <Modal
      isOpen={isCreateModalOpen}
      onClose={closeCreateModal}
      title="새로운 업무 요청"
    >
      <form onSubmit={handleCreateTicket} className="space-y-6">
        {/* 업무 타이틀 */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-wider">
            업무 타이틀
            </label>
          <input name="title" required className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold" placeholder="업무 핵심 주제" />
        </div>
        {/* 담당자 선택 */}
        <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-wider">
              담당자 선택
            </label>
            <div className="relative">
              <select
                name="worker_id"
                required
                onChange={handleWorkerChange}
                className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-[16px] text-slate-600 cursor-pointer appearance-none transition-all"
              >
              <option value="">담당자를 선택해주세요</option>
                {membersWithId?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>

              {/* 화살표 커스텀 */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        {/* 상세 내용 */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-wider">
            요청 상세 내용
            </label>
          <textarea
              name="content"
              required
              className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none min-h-37.5 font-bold"
              placeholder="수정 사항을 상세히 입력하세요."
            />
        </div>
        {/* 버튼 영역 */}
        <div className="flex gap-3 mt-4">
          <button type="button" 
          onClick={closeCreateModal}
          className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold hover:bg-slate-200 active:scale-[0.98] transition-all cursor-pointer">
            취소
          </button>
          <button type="submit" 
          className="flex-2 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer">
            요청 발행 (Todo)
          </button>
        </div>
      </form>
    </Modal>
  );

  // Task 없을 때 화면
  if (isEmpty) {
    return (
      <>
        <div className="h-full w-full flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
          <div className="text-center space-y-3 mb-10">
            <p className="text-slate-400 font-medium text-2xl whitespace-pre-wrap">
              { "팀원들과 빠르게 \n 업무 요청을 해보세요!" }
            </p>
          </div>
          <button
            onClick={() => setActiveModal('create')}
            className="group bg-blue-600 hover:bg-blue-700 text-white px-30 py-5 rounded-4xl font-black flex items-center gap-3 shadow-2xl shadow-blue-200 transition-all active:scale-95 text-xl" 
          >
            새 요청
          </button>
        </div>
        {CreateTicketModal}
      </>
    );
  }

  // Task 있을 때 화면
  return (
    <>
      <div className="flex gap-6 h-full min-w-300">
        {STATUS_TYPES.map((status) => {
          // 업데이트 된 teams에서 현재 팀의 task 필터링
          const filteredTickets = activeTeam.tickets.filter((t) => t.status === status.id);
          return (
            <KanbanColumn
              key={status.id}
              status={status}
              tickets={filteredTickets}
              onTicketClick={setSelectedTicketId}
              updateTicketStatus={updateTicketStatus} 
            />
          );
        })}
      </div>
      {CreateTicketModal}
    </>
  );
};