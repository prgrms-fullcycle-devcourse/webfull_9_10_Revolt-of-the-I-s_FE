import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AtSign, Lock, LogIn, ChevronRight } from 'lucide-react'
import { loginApi } from '../api/auth'
import type { CurrentUser } from '../types'
import { AVATARS } from '../utils/constants'

// Props 타입 정의: 로그인 성공 시 유저 정보를 저장할 함수와 회원가입 이동 함수
interface LoginProps {
  setCurrentUser: (user: CurrentUser) => void
  goSignup: () => void
}

export const Login = ({ setCurrentUser, goSignup }: LoginProps) => {
  // --- [1] 상태 관리 (Form State) ---
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // --- [2] 유효성 검사 (Simple Validation) ---
  // 이메일과 비밀번호가 비어있지 않은지 확인 (공백 제거 후 체크)
  const isValid = email.trim() !== '' && password.trim() !== ''

  // --- [3] 데이터 통신 (API Mutation) ---
  const loginMutation = useMutation({
    mutationFn: loginApi, // api/auth.ts에 정의된 로그인 호출 함수
    onSuccess: (user) => {
      // 로그인 성공 시: 유저 데이터에 랜덤 아바타를 추가하여 앱 전체 상태에 저장
      setCurrentUser({
        ...user,
        avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      })
    },
    onError: () => {
      // 로그인 실패 시 에러 알림
      alert('로그인에 실패했습니다.')
    },
  })

  // --- [4] 이벤트 핸들러 ---
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault() // 폼 제출 시 페이지 새로고침 방지
    if (!isValid) return // 유효하지 않으면 뮤테이션 실행 안 함

    // API 서버로 이메일과 비밀번호 전송
    loginMutation.mutate({
      email,
      password,
    })
  }

  return (
    // 배경색 및 중앙 정렬 레이아웃
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* 상단 헤더: 아이콘 및 서비스 이름 */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/20">
            <LogIn size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic">i-Station</h1>
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-widest opacity-80 mt-1">
            개인 계정 로그인
          </p>
        </div>

        {/* 로그인 카드 폼 (Glassmorphism 스타일) */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 이메일 입력 영역 */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-2">
                <AtSign size={12} /> 이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="mail@istation.dev"
              />
            </div>

            {/* 비밀번호 입력 영역 */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-2">
                <Lock size={12} /> 비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="비밀번호 입력"
              />
            </div>

            {/* 로그인 실행 버튼: 유효성 검사 실패 또는 통신 중일 때 비활성화 */}
            <button
              type="submit"
              disabled={!isValid || loginMutation.isPending}
              className={`w-full font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl text-lg transition-all ${
                isValid && !loginMutation.isPending
                  ? 'bg-blue-600 hover:bg-blue-500 text-white' // 활성화 스타일
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed' // 비활성화 스타일
              }`}
            >
              {/* 통신 상태에 따른 버튼 텍스트 변경 */}
              {loginMutation.isPending ? '로그인 중...' : '시작하기'}
              <ChevronRight size={20} />
            </button>

            {/* 회원가입 페이지 이동 버튼 */}
            <button
              type="button"
              onClick={goSignup}
              className="w-full text-sm text-slate-300 hover:text-white transition"
            >
              회원가입으로 이동
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}