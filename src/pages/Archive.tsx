import {
  Plus,
  Link as LinkIcon,
  FileText,
  File,
  Eye,
  Trash2,
} from 'lucide-react';
import type { Team, Note, TeamLink } from '../types';

interface ArchiveProps {
  activeTeam: Team; // 현재 활성화된 팀의 모든 데이터 (links, notes 포함)
  setIsLinkModalOpen: (open: boolean) => void; // 링크 추가 모달 제어 함수
  setIsDocModalOpen: (open: boolean) => void; // 문서 추가 모달 제어 함수
  setIsNoteModalOpen: (open: boolean) => void; // 회의록 추가 모달 제어 함수
  setIsDeleteLinkModalOpen: (open: TeamLink) => void; // 링크 삭제 모달 호출 함수
  setSelectedNote: (note: Note) => void; // 특정 회의록 클릭 시 상세보기 모달 호출 함수
}

export const Archive = ({
  activeTeam,
  setIsLinkModalOpen,
  setIsDocModalOpen,
  setIsNoteModalOpen,
  setIsDeleteLinkModalOpen,
  setSelectedNote,
}: ArchiveProps) => {
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto py-4">
      {/* 핵심 문서 & 퀵 링크 섹션 */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-112.5">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 shrink-0">
              <LinkIcon size={24} />
            </div>
            <div>
              <h3 className="font-bold text-xl">핵심 문서 & 퀵 링크</h3>
              <p className="text-xs text-slate-400 font-medium">
                기획서, 피그마, API 명세서 등 팀 공용 리소스
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDocModalOpen(true)}
              className="bg-orange-400 hover:bg-orange-500 text-white flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold shadow-lg text-sm shrink-0 cursor-pointer"
            >
              <Plus size={18} /> 문서 추가
            </button>
            <button
              onClick={() => setIsLinkModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold shadow-lg text-sm shrink-0 cursor-pointer"
            >
              <Plus size={18} /> 링크 추가
            </button>
          </div>
        </div>

        {/* 링크 그리드 리스트 */}

        {activeTeam.links.length > 0 ? (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto bg-slate-50/30 min-h-0">
            {activeTeam.links.map((link) => (
              <div
                key={link.id}
                onClick={() =>
                  window.open(link.url, '_blank', 'noopener,noreferrer')
                }
                className={`flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white ${link.type === 'documents' ? 'hover:border-orange-200' : link.type === 'links' ? 'hover:border-purple-200' : 'hover:border-slate-200'} hover:shadow-md transition-all group text-slate-700 min-w-0 cursor-pointer`}
              >
                <div className="flex justify-between gap-3 min-w-0 w-full">
                  {/* 타입별 아이콘 배경색 조건부 렌더링 (문서: 주황, 링크 : 보라, 그 외 : 회색) */}
                  <div className="flex items-center gap-3 truncate">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${link.type === 'documents' ? 'bg-orange-400' : link.type === 'links' ? 'bg-purple-400' : 'bg-slate-400'}`}
                    >
                      {link.type === 'links' ? (
                        <LinkIcon size={18} />
                      ) : link.type === 'documents' ? (
                        <File size={18} />
                      ) : (
                        <LinkIcon size={18} />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <span
                        className={`text-sm font-bold block truncate ${link.type === 'documents' ? 'group-hover:text-orange-600' : link.type === 'links' ? 'group-hover:text-purple-600' : 'group-hover:text-slate-600'}`}
                      >
                        {link.title}
                      </span>
                      {/* URL에서 도메인 주소만 추출하여 표시 */}
                      <span className="text-[10px] text-slate-400 font-mono truncate block">
                        {new URL(link.url).hostname}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDeleteLinkModalOpen(link);
                    }}
                    className=" bg-white hover:bg-slate-50 text-slate-400 flex items-center gap-2 px-2 py-2.5 rounded-xl font-bold  text-sm shrink-0 cursor-pointer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12  min-h-0 text-slate-400 flex w-full text-center justify-center ">
            팀원들과 공유할 문서 혹은 링크를 추가해보세요
          </div>
        )}
      </section>

      {/* 간편 회의록 섹션 */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-125">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="font-bold text-xl">간편 회의록</h3>
              <p className="text-xs text-slate-400 font-medium">
                결정 사항 중심의 가벼운 마크다운 기록장
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsNoteModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 text-sm shrink-0 cursor-pointer"
          >
            <Plus size={18} /> 회의록 작성
          </button>
        </div>

        {/* 회의록 카드 그리드 리스트 */}
        {activeTeam.notes.length > 0 ? (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
            {activeTeam.notes.map((note) => (
              <div
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className="p-6 rounded-3xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-blue-200 hover:shadow-xl transition-all cursor-pointer group flex flex-col h-50"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                    {note.date}
                  </span>
                  <Eye
                    size={16}
                    className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0"
                  />
                </div>
                <h4 className="font-bold text-base group-hover:text-blue-600 mb-2 truncate">
                  {note.title}
                </h4>
                {/* 본문 미리보기: 마크다운 문법 기호(#, *)를 제거하여 순수 텍스트만 깔끔하게 노출 */}
                <div className="text-xs text-slate-500 line-clamp-4 leading-relaxed overflow-hidden flex-1 min-h-0">
                  {note.content.replace(/[#*]/g, '')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-slate-400 flex flex-1 flex-col w-full text-center justify-center ">
            팀원들과 진행한 회의록을 간단히 작성하여 공유해보세요
          </div>
        )}
      </section>
    </div>
  );
};
