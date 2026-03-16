import { StatusBadge } from './StatusBadge';
import type { CurrentUser } from '../../types';

interface MemberStatusItemProps {
  member: CurrentUser; // 표시할 유저 정보
  status: {  // 해당 유저의 현재 상태 정보
    label: string;
    color: string;
  };
  showLabel?: boolean;
}

export const MemberStatusItem = ({ member, status, showLabel = true }: MemberStatusItemProps) => {
  return (
    <div className="flex items-center gap-3 py-2 px-1 group transition-all">
      {/* 유저 아바타 */}
      <div className="relative shrink-0">
        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs border border-slate-200 shadow-sm">
          {member.name[0]}
        </div>
      </div>

      {/* 유저 정보 및 상태 배지 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-700 truncate group-hover:text-blue-600 transition-colors">
          {member.name}
        </p>
        {/* 공통 컴포넌트인 StatusBadge를 호출하여 상태 표시 */}
        <StatusBadge 
          color={status.color} 
          label={status.label} 
          showLabel={showLabel} 
          size="sm" 
        />
      </div>
    </div>
  );
};