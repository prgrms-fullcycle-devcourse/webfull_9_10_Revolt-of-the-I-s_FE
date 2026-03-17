import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { UserPlus, User, Phone, AtSign, Lock, ChevronRight } from 'lucide-react'
import { signupApi } from '../api/auth'
import type { CurrentUser } from '../types'
import { AVATARS } from '../utils/constants'

// Props 타입 정의: 부모로부터 유저 상태 설정 함수와 페이지 이동 함수를 받음
interface SignupProps {
  setCurrentUser: (user: CurrentUser) => void
  goLogin: () => void
}

export const Signup = ({ setCurrentUser, goLogin }: SignupProps) => {
  // --- [1] 상태 관리 (Form State) ---
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordCheck, setPasswordCheck] = useState('')

  // --- [2] 실시간 유효성 검사 (Validation) ---
  // useMemo를 사용해 비밀번호 확인 입력값이 변할 때만 일치 여부를 재계산함
  const isPasswordMatch = useMemo(() => {
    if (!passwordCheck) return true // 아직 입력 안 했을 때는 경고를 띄우지 않음
    return password === passwordCheck
  }, [password, passwordCheck])

  // 전체 폼이 유효한지 확인 (모든 값이 있고, 비밀번호가 일치해야 함)
  const isValid =
    name.trim() !== '' &&
    phone.trim() !== '' &&
    email.trim() !== '' &&
    password.trim() !== '' &&
    passwordCheck.trim() !== '' &&
    isPasswordMatch

  // --- [3] 데이터 통신 (API Mutation) ---
  const signupMutation = useMutation({
    mutationFn: signupApi, // 실제로 실행될 비동기 가입 함수
    onSuccess: (user) => {
      // 가입 성공 시: 랜덤 아바타를 부여하고 전역 유저 상태를 업데이트함
      setCurrentUser({
        ...user,
        avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      })
    },
    onError: () => {
      alert('회원가입에 실패했습니다.')
    },
  })

  // --- [4] 이벤트 핸들러 ---
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault() // 페이지 새로고침 방지
    if (!isValid) return // 유효하지 않으면 실행 안 함

    // API 호출 실행
    signupMutation.mutate({
      name,
      phone,
      email,
      password,
    })
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 상단 로고 및 타이틀 섹션 */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/20">
            <UserPlus size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic">i-Station</h1>
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-widest opacity-80 mt-1">
            회원가입
          </p>
        </div>

        {/* 회원가입 카드 폼 */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* 이름 입력 필드 */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-2">
                <User size={12} /> 이름
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="이름 입력"
              />
            </div>

            {/* 전화번호 입력 필드 */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-2">
                <Phone size={12} /> 전화번호
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="01012345678"
              />
            </div>

            {/* 이메일 입력 필드 */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-2">
                <AtSign size={12} /> 이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="mail@istation.dev"
              />
            </div>

            {/* 비밀번호 입력 필드 */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-2">
                <Lock size={12} /> 비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="비밀번호 입력"
              />
            </div>

            {/* 비밀번호 확인 필드: 일치 여부에 따라 스타일 및 메시지 변경 */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-2">
                <Lock size={12} /> 비밀번호 확인
              </label>
              <input
                type="password"
                value={passwordCheck}
                onChange={(e) => setPasswordCheck(e.target.value)}
                className={`w-full bg-slate-800/50 border rounded-2xl px-6 py-4 text-white text-sm focus:ring-2 outline-none ${
                  passwordCheck && !isPasswordMatch
                    ? 'border-red-500 focus:ring-red-500' // 불일치 시 빨간 테두리
                    : 'border-white/5 focus:ring-blue-500' // 일치 시 일반 테두리
                }`}
                placeholder="비밀번호 다시 입력"
              />
              {/* 비밀번호 피드백 메시지 */}
              {passwordCheck && !isPasswordMatch && (
                <p className="text-xs text-red-400 ml-1">비밀번호가 일치하지 않습니다.</p>
              )}
              {passwordCheck && isPasswordMatch && (
                <p className="text-xs text-green-400 ml-1">비밀번호가 일치합니다.</p>
              )}
            </div>

            {/* 가입 버튼: 로딩 중이거나 유효하지 않으면 비활성화 */}
            <button
              type="submit"
              disabled={!isValid || signupMutation.isPending}
              className={`w-full font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl text-lg transition-all ${
                isValid && !signupMutation.isPending
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              {signupMutation.isPending ? '가입 중...' : '가입하기'}
              <ChevronRight size={20} />
            </button>

            {/* 로그인 이동 버튼 */}
            <button
              type="button"
              onClick={goLogin}
              className="w-full text-sm text-slate-300 hover:text-white transition"
            >
              로그인으로 이동
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}