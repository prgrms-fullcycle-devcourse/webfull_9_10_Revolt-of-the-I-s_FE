import React, { useRef, useEffect, useState } from 'react';
import { X, Clock, ArrowRight, Send, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { Ticket, Team, CurrentUser } from '../../types';

interface TicketDetailProps {
  ticket: Ticket;
  activeTeam: Team;
  currentUser: CurrentUser;
  onClose: () => void; // 모달 닫기 함수
  addComment: (e: React.FormEvent<HTMLFormElement>) => void; // 댓글 등록 함수
  activeTeamId: string | number | null;
  handleDeleteTicketApi: (ticketId: number) => Promise<{ ok: boolean; message?: string }>;
  onUpdateComment: (commentId: number, text: string) => Promise<void>;
  onDeleteComment: (commentId: number) => Promise<void>;
  onUpdateTicket: (taskId: number, data: { title: string; content: string; worker_id: string }) => Promise<void>;
}

export const TicketDetail = ({ ticket, currentUser, onClose, addComment, handleDeleteTicketApi, onUpdateComment, onDeleteComment, onUpdateTicket }: TicketDetailProps) => {

  // 권한 체크
  const isWorker = String(currentUser?.uuid) === String(ticket.worker_id);
  const isRequester = String(currentUser?.uuid) === String(ticket.requester_id);

  const [isEditingTask, setIsEditingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: ticket.title,
    content: ticket.content,
    worker_id: ticket.worker_id
  });

  const [editingCommentId, setEditingCommentId] = useState<number | null>(null); // 현재 수정 중인 댓글 ID
  const [editValue, setEditValue] = useState(""); // 수정 중인 입력값
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null); // 현재 메뉴가 열린 댓글 ID

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

  // --- 핸들러 함수들 ---
  const startEdit = (id: number, currentText: string) => {
    setEditingCommentId(id);
    setEditValue(currentText);
    setActiveMenuId(null);
  };

  const handleUpdate = async (commentId: number) => {
    if (!editValue.trim()) return;
    await onUpdateComment(commentId, editValue); 
    setEditingCommentId(null);
  };

  const handleDelete = async (commentId: number) => {
    if (window.confirm("댓글을 삭제하시겠습니까?")) {
      // props로 받은 onDeleteComment 호출
      await onDeleteComment(commentId);
      setActiveMenuId(null);
    }
  };

  // task 수정 핸들러
  const handleTaskUpdate = async () => {
    if (!taskForm.title.trim() || !taskForm.content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }
    await onUpdateTicket(ticket.id, taskForm);
    setIsEditingTask(false);
  };

  // 삭제(요청 취소) 핸들러
  const onClickDelete = async () => {
    if (!window.confirm('정말 이 테스크를 삭제하시겠습니까?')) return;

    try {
      const result = await handleDeleteTicketApi(ticket.id);
      if (result.ok) {
        onClose();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("삭제 중 에러:", error);
    }
  };

  // 댓글 팝업 바깥 클릭 감지를 위한 Ref
  const commentMenuRef = useRef<HTMLDivElement>(null);

  // ✅ 댓글 메뉴 바깥 클릭 시 닫기 로직
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // 클릭된 타겟이 메뉴 영역(commentMenuRef) 외부에 있다면 닫기
      if (commentMenuRef.current && !commentMenuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };

    if (activeMenuId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);
  
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
              {isEditingTask ? (
                <input
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full text-2xl font-black text-slate-900 leading-tight border-b-2 border-blue-500 outline-none"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black text-slate-900 leading-tight truncate">
                    {ticket.title}
                  </h3>
                  {/* [수정됨] 표시 */}
                  {ticket.is_edited && (
                    <span className="shrink-0 bg-slate-100 text-slate-400 text-[10px] px-2 py-0.5 rounded-md font-bold">
                      [수정됨]
                    </span>
                  )}
                </div>
              )}
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
          {/* 수정/저장 버튼 */}
          <div className="flex items-center gap-2">
            {isRequester && (
              isEditingTask ? (
                <button 
                  onClick={handleTaskUpdate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700"
                >
                  저장
                </button>
              ) : (
                <button 
                  onClick={() => setIsEditingTask(true)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all"
                >
                  <Pencil size={20} />
                </button>
              )
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all">
              <X size={28} />
            </button>
          </div>
        </header>

        {/* 바디 섹션: 내용, 담당자 정보, 상태 변경, 댓글 리스트 */}
        <div className="flex-1 overflow-y-auto px-8 flex flex-col space-y-8 scrollbar-hide min-h-0">
          {/* 업무 설명 박스 */}
          <div className="bg-slate-50/50 p-8 rounded-4xl border border-slate-100">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mb-6">
              <Clock size={12} /> {ticket.createdAt} 발행
            </div>
            {isEditingTask ? (
              <textarea
                value={taskForm.content}
                onChange={(e) => setTaskForm({ ...taskForm, content: e.target.value })}
                className="w-full h-32 p-4 text-sm text-slate-600 leading-relaxed bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500"
              />
            ) : (
              <div className="text-sm text-slate-600 leading-relaxed mb-8">
                {ticket.content}
              </div>
            )}
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
          <div className="flex-1 flex flex-col space-y-6 pb-8">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">커뮤니케이션</p>
          
          {/* 댓글 리스트 섹션 */}
          <div className="flex-1 space-y-4">
            {ticket.comments.map((c) => {
              const isMe = c.user === currentUser.name;
              const isEditing = editingCommentId === c.id;
              const isMenuOpen = activeMenuId === c.id;

              return (
                <div 
                  key={c.id} 
                  className={`flex gap-3 group relative ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  // onMouseLeave={() => setActiveMenuId(null)}
                >
                  {/* 아바타 영역: 이미지 우선 노출 */}
                  <div className={`w-8 h-8 rounded-full overflow-hidden relative shrink-0 flex items-center justify-center ${isMe ? 'bg-blue-600' : 'bg-slate-200'}`}>
                    
                    {/* 작성자 이미지가 존재할 때 출력 */}
                    {c.userImage ? (
                      <img 
                        src={c.userImage} 
                        alt={c.user} 
                        className="w-full h-full object-cover relative z-10"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : null}

                    {/* 이미지가 없거나 로드 실패 시 이름 첫 글자 (기존 로직) */}
                    <span className="text-white font-bold text-[10px] absolute z-0">
                      {c.user ? c.user[0] : '?'}
                    </span>
                  </div>

                  {/* 말풍선 컨테이너 */}
                  <div className={`relative max-w-[75%] group/bubble flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {isEditing ? (
                      <div className="flex flex-col gap-2 w-full">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full p-3 text-xs bg-white border-2 border-blue-500 rounded-2xl outline-none focus:ring-0"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingCommentId(null)} className="text-[10px] font-bold text-slate-400">취소</button>
                          <button onClick={() => handleUpdate(c.id)} className="text-[10px] font-bold text-blue-600">저장</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* 댓글 말풍선 */}
                        <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                          isMe 
                            ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                            : 'bg-slate-50 text-slate-600 rounded-tl-none border border-slate-100'
                        }`}>
                          {!isMe && <p className="text-[9px] font-black mb-1 opacity-60">{c.user}</p>}
                          <span>{c.text}</span>
                        </div>

                        {/* 표시를 말풍선 바깥쪽으로 이동 */}
                        <div className={`flex items-center gap-1.5 mb-1 shrink-0 relative ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        {c.is_edited && (
                          <span className="text-[8px] font-bold text-slate-400 opacity-60">
                            (수정됨)
                          </span>
                        )}
                      
                        {/* [더보기 버튼] 내 글일 때만 노출 */}
                        {isMe && !isEditing && (
                          <div 
                            className="relative" 
                            // ✅ 현재 이 댓글의 메뉴가 열려있을 때만 Ref를 연결하여 감지 대상으로 지정
                            ref={isMenuOpen ? commentMenuRef : null}
                          >
                            <button 
                              onClick={(e) => {
                                e.stopPropagation(); 
                                setActiveMenuId(isMenuOpen ? null : c.id);
                              }}
                              className="p-1 text-slate-300 hover:text-slate-600 transition-all rounded-full hover:bg-slate-50"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                      
                        {/* ✅ 더보기 버튼 바로 아래에 고정되도록 이동 */}
                        {isMenuOpen && (
                          <div className={`absolute z-10 top-full mt-2 ${isMe ? 'right-0' : 'left-0'} bg-white border border-slate-100 shadow-xl rounded-xl overflow-hidden py-1 min-w-24`}>
                            <button 
                              onClick={() => startEdit(c.id, c.text)}
                              className="w-full px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Pencil size={12} /> 수정
                            </button>
                            <button 
                              onClick={() => handleDelete(c.id)}
                              className="w-full px-3 py-2 text-[10px] font-bold text-red-500 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 size={12} /> 삭제
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>

        {/* 푸터 섹션: 댓글 입력 폼 */}
        <div className="px-8 py-6 border-t border-slate-100 bg-white shrink-0">
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
    </div>
    </div>
  );
};