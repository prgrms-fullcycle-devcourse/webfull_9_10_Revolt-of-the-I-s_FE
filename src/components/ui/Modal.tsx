import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string; // 모달 너비를 조절하고 싶을 때 사용
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}: ModalProps) => {
  // 모달이 닫혀있으면 아무것도 렌더링하지 않음
  if (!isOpen) return null;

  return (
    // 배경 오버레이 (Backdrop): 전체 화면을 덮고 클릭 시 onClose 실행
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      {/* 모달 외부 클릭 시 닫기 위한 투명 배경 */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* 실제 모달 콘텐츠 박스 */}
      <div
        className={`bg-white w-full ${maxWidth} rounded-4xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] border border-slate-100`}
      >
        {/* 모달 헤더 섹션: 제목 */}
        {title && (
          <header className="px-8 py-5 border-b border-slate-100 relative">
            <h3 className="text-lg font-black text-slate-800 tracking-tight text-center">
              {title}
            </h3>

            {/* X 닫기 버튼 */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
              aria-label="모달 닫기"
            >
              <X size={20} />
            </button>
          </header>
        )}

        {/* 제목이 없을 때도 X 버튼은 유지 */}
        {!title && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 transition-colors z-20"
            aria-label="모달 닫기"
          >
            <X size={20} />
          </button>
        )}

        {/* 모달 내부 콘텐츠 */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-8">
          {children}
        </div>
      </div>
    </div>
  );
};