import { Plus, Link as LinkIcon, FileText, FileCode, Eye } from 'lucide-react';
import type { Team, Note } from '../types';

interface ArchiveProps {
  activeTeam: Team;            // 현재 활성화된 팀의 모든 데이터 (links, notes 포함)
  setIsLinkModalOpen: (open: boolean) => void; // 링크 추가 모달 제어 함수
  setIsNoteModalOpen: (open: boolean) => void; // 회의록 추가 모달 제어 함수
  setSelectedNote: (note: Note) => void;       // 특정 회의록 클릭 시 상세보기 모달 호출 함수
}

export const Archive = ({ activeTeam, setIsLinkModalOpen, setIsNoteModalOpen, setSelectedNote }: ArchiveProps) => {
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
              <p className="text-xs text-slate-400 font-medium">기획서, 피그마, API 명세서 등 팀 공용 리소스</p>
            </div>
          </div>
          <button onClick={() => setIsLinkModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold shadow-lg text-sm shrink-0">
            <Plus size={18} /> 링크 추가
          </button>
        </div>

        {/* 링크 그리드 리스트 */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto bg-slate-50/30 min-h-0">
          {activeTeam.links.map((link) => (
            <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white hover:border-purple-200 hover:shadow-md transition-all group text-slate-700 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                {/* 타입별 아이콘 배경색 조건부 렌더링 (planning: 주황, dev: 파랑, etc: 회색) */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${link.type === 'planning' ? 'bg-orange-400' : link.type === 'dev' ? 'bg-blue-400' : 'bg-slate-400'}`}>
                  {link.type === 'planning' ? <FileText size={18} /> : link.type === 'dev' ? <FileCode size={18} /> : <LinkIcon size={18} />}
                </div>
                <div className="overflow-hidden">
                  <span className="text-sm font-bold block truncate group-hover:text-purple-600">{link.title}</span>
                  {/* URL에서 도메인 주소만 추출하여 표시 */}
                  <span className="text-[10px] text-slate-400 font-mono truncate block">{new URL(link.url).hostname}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
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
              <p className="text-xs text-slate-400 font-medium">결정 사항 중심의 가벼운 마크다운 기록장</p>
            </div>
          </div>
          <button onClick={() => setIsNoteModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 text-sm shrink-0">
            <Plus size={18} /> 회의록 작성
          </button>
        </div>
        
        {/* 회의록 카드 그리드 리스트 */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto min-h-0">
          {activeTeam.notes.map((note) => (
            <div key={note.id} onClick={() => setSelectedNote(note)} className="p-6 rounded-3xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-blue-200 hover:shadow-xl transition-all cursor-pointer group flex flex-col h-50">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{note.date}</span>
                <Eye size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
              </div>
              <h4 className="font-bold text-base group-hover:text-blue-600 mb-2 truncate">{note.title}</h4>
              {/* 본문 미리보기: 마크다운 문법 기호(#, *)를 제거하여 순수 텍스트만 깔끔하게 노출 */}
              <div className="text-xs text-slate-500 line-clamp-4 leading-relaxed overflow-hidden flex-1 min-h-0">
                {note.content.replace(/[#*]/g, '')}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};