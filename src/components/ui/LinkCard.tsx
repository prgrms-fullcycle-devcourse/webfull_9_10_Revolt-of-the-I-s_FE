import { FileText, FileCode, Link as LinkIcon } from 'lucide-react';
import type { TeamLink } from '../../types';

export const LinkCard = ({ link }: { link: TeamLink }) => (
  <a
    href={link.url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white hover:border-purple-200 hover:shadow-md transition-all group text-slate-700 min-w-0"
  >
    <div className="flex items-center gap-3 min-w-0">
      {/* 타입별 아이콘 및 배경색 (인라인 조건부 렌더링) */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${
        link.type === 'planning' ? 'bg-orange-400' : // 기획: 주황색
        link.type === 'dev' ? 'bg-blue-400' : // 개발: 파란색
        'bg-slate-400'// 기타: 회색
      }`}>
        {link.type === 'planning' ? <FileText size={18} /> : link.type === 'dev' ? <FileCode size={18} /> : <LinkIcon size={18} />}
      </div>
      {/* 링크 정보 섹션 (텍스트 넘침 방지 처리) */}
      <div className="overflow-hidden">
        <span className="text-sm font-bold block truncate group-hover:text-purple-600">{link.title}</span>
        {/* 도메인 추출: 복잡한 URL 대신 'github.com' 처럼 도메인 본체만 깔끔하게 출력 */}
        <span className="text-[10px] text-slate-400 font-mono truncate block">{new URL(link.url).hostname}</span>
      </div>
    </div>
  </a>
);