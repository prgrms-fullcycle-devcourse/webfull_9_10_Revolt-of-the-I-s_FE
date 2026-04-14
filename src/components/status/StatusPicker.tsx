import { LogOut, UserMinus } from 'lucide-react';
import { USER_ACTIVITIES } from '../../utils/constants';

interface StatusPickerProps {
  currentStatusLabel: string; // 현재 적용되어 있는 내 상태 라벨
  onStatusChange: (activity: typeof USER_ACTIVITIES[0]) => void; // 상태 클릭 시 변경 핸들러
  onLogout: () => void; // 로그아웃 클릭 시 실행될 핸들러
  handleLeaveTeam: () => void; // 팀 탈퇴 핸들러
}

export const StatusPicker = ({ currentStatusLabel, onStatusChange, onLogout, handleLeaveTeam }: StatusPickerProps) => {
  return (
    // 사이드바 하단 프로필 위에 떠야 하므로 absolute와 bottom-full 적용
    <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50">
      {/* 팀 탈퇴 버튼 */}
        <button
          onClick={handleLeaveTeam}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
        >
          <UserMinus size={14} /> 팀 탈퇴하기
        </button>

      {/* 로그아웃 버튼 (상단 구분선 포함) */}
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold  text-slate-600 hover:bg-slate-50  mb-2"
      >
        <LogOut size={14} /> 시스템 로그아웃
      </button>

      <div className="my-1.5 border-t border-slate-200/60 mx-2" />

      {/* 상태 선택 리스트 */}
      <div className="space-y-1">
        {USER_ACTIVITIES.map((act) => (
          <button
            key={act.label}
            onClick={() => onStatusChange(act)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              currentStatusLabel === act.label
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {/* 각 상태 원형 배지 표시 */}
            <span className={`w-2 h-2 rounded-full ${act.color}`} />
            {act.label}
          </button>
        ))}
      </div>
    </div>
  );
};