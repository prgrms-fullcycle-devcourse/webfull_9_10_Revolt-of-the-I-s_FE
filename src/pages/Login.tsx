import React from 'react';
import { LogIn, User, Briefcase, AtSign, Github, ChevronRight } from 'lucide-react';
import type { CurrentUser } from '../types';
import { AVATARS } from '../utils/constants';

interface LoginProps {
  setCurrentUser: (user: CurrentUser) => void; // 입력된 유저 정보를 App 상단으로 전달
}

export const Login = ({ setCurrentUser }: LoginProps) => {
  /**
   * [핸들러] handlePersonalLogin
   * @description 폼 제출 시 실행되며, FormData를 추출하여 유저 상태를 업데이트합니다.
   */
  const handlePersonalLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // 폼 데이터 추출
    const formData = new FormData(e.currentTarget);
    // 상위 컴포넌트로 유저 정보 전달 (로그인 상태 업데이트)
    setCurrentUser({
      name: formData.get('username') as string,
      email: formData.get('email') as string,
      position: formData.get('position') as string,
      github: (formData.get('github') as string) || '',
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    });
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="max-w-md w-full">

        {/* 상단 로고 및 타이틀 섹션 */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/20">
            <LogIn size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic">i-Station</h1>
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-widest opacity-80 mt-1">
            개인 계정 로그인
          </p>
        </div>

        {/* 로그인 폼 카드 (Glassmorphism 디자인 적용) */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-10 shadow-2xl">
          <form onSubmit={handlePersonalLogin} className="space-y-6">

            {/* 이름 및 포지션 (그리드 레이아웃) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-2">
                  <User size={12} /> 이름
                </label>
                <input name="username" required className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="본명 입력" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-2">
                  <Briefcase size={12} /> 포지션
                </label>
                <input name="position" required className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ex. Frontend" />
              </div>
            </div>

            {/* 이메일 입력 섹션 */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-2">
                <AtSign size={12} /> 이메일
              </label>
              <input name="email" type="email" required className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="mail@istation.dev" />
            </div>

            {/* 깃허브 링크 입력 섹션 (선택 사항) */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-2">
                <Github size={12} /> 깃허브 (선택)
              </label>
              <input name="github" className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono" placeholder="https://github.com/..." />
            </div>

            {/* 시작하기 버튼 */}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl text-lg">
              시작하기 <ChevronRight size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};