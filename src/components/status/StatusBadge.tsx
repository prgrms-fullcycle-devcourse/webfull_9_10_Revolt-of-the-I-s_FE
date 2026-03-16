interface StatusBadgeProps {
  color?: string;   // 상태별 고유 색상 클래스 (예: 'bg-green-500', 'bg-slate-300')
  label?: string;   // 상태 명칭 (예: '개발 중', '자리 비움')
  showLabel?: boolean; // 텍스트 라벨을 함께 보여줄지 여부
  size?: 'sm' | 'md'; // 배지의 크기 조절
}

export const StatusBadge = ({ 
  color = 'bg-slate-300', // 기본값: 오프라인(회색)
  label, 
  showLabel = false, 
  size = 'md' 
}: StatusBadgeProps) => {
  // 사이즈별 스타일 정의
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <div className={`inline-flex items-center gap-1.5 ${textSize} font-bold`}>
      {/* 상태 원형 포인트: 전달받은 color 클래스를 동적으로 적용 */}
      <span className={`${dotSize} rounded-full shrink-0 ${color || 'bg-slate-300'}`} />
      
      {/* 라벨: showLabel이 true이고 label 값이 있을 때만 렌더링 */}
      {showLabel && label && (
        <span className="truncate text-slate-300">{label}</span>
      )}
    </div>
  );
};