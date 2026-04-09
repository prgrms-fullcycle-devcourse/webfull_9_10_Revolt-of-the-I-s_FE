import { Eye } from 'lucide-react';
import type { TeamArchiveData } from '../../types';

interface NoteCardProps {
  note: TeamArchiveData;
  onClick: (note: TeamArchiveData) => void; // 카드 클릭 시 전체 내용을 보여주기 위한 핸들러
}

export const NoteCard = ({ note, onClick }: NoteCardProps) => (
  <div
    onClick={() => onClick(note)}
    className="p-6 rounded-3xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-blue-200 hover:shadow-xl transition-all cursor-pointer group flex flex-col h-50"
  >
    {/* 상단: 아이콘 및 날짜 정보 */}
    <div className="flex justify-between items-start mb-3">
      <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
        {note.created_at}
      </span>
      <Eye
        size={16}
        className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0"
      />
    </div>
    {/* 중단: 제목 및 본문 미리보기(2줄 제한) */}
    <h4 className="font-bold text-base group-hover:text-blue-600 mb-2 truncate">
      {note.title}
    </h4>
    {/* 하단: 작성자 정보 */}
    <div className="text-xs text-slate-500 line-clamp-4 leading-relaxed overflow-hidden flex-1 min-h-0">
      {note.content.replace(/[#*]/g, '')}
    </div>
  </div>
);
