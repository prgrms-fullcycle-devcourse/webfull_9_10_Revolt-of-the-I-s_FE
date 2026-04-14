import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AtSign, Lock, LogIn, ChevronRight } from 'lucide-react'
import { loginApi, googleAuthApi, getMyInfoApi } from '../api/auth'
import { AVATARS } from '../utils/constants'
import type { CurrentUser } from '../types'
import axios from 'axios'

interface LoginProps {
  setCurrentUser: (user: CurrentUser) => void
  goSignup: () => void
}

export const Login = ({ setCurrentUser, goSignup }: LoginProps) => {
  // --- [1] 상태 관리 (Form State) ---
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // 구글 로그인 중복 호출 방지용 pending ref
  const googleLoginPendingRef = useRef(false)

  // googleLoginMutation.mutate를 ref로 분리 → 의존성 없이 최신 함수 참조
  const googleLoginMutateRef = useRef<((data: { googleToken: string }) => void) | null>(null)

  // --- [2] 유효성 검사 (Simple Validation) ---
  // 이메일과 비밀번호가 비어있지 않은지 확인 (공백 제거 후 체크)
  const isValid = email.trim() !== '' && password.trim() !== ''

  // 구글 클라이언트 ID 정리
  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim().replace(/^"(.*)"$/, '$1')

  // 로그인 성공 시 공통으로 유저 저장
  const saveUser = (
    user: { uuid: string; name: string; profile_image: string | null },
    userEmail: string
  ) => {
    const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)]
    const avatarImage =
      typeof user.profile_image === 'string' && user.profile_image.trim() !== ''
        ? user.profile_image
        : randomAvatar

    const displayName = user.name || userEmail.split('@')[0] || '사용자'
    localStorage.setItem('displayName', displayName)

    setCurrentUser({
      uuid: user.uuid,
      name: displayName,
      position: '',
      avatar: avatarImage,
      email: userEmail,
      phone: '',
      github: '',
    })
  }

  // 일반 로그인 API
  const loginMutation = useMutation({
    mutationFn: loginApi,

    // 일반 로그인 성공
    onSuccess: (data) => {
      if (!data.success || !data.data) {
        alert(data.error || '로그인에 실패했습니다.')
        return
      }

      saveUser(data.data.user, email)
    },

    // 일반 로그인 실패
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.error || '로그인에 실패했습니다.')
        return
      }

      // 로그인 실패 시 에러 알림
      alert('로그인에 실패했습니다.')
    },
  })

  // 구글 OAuth 로그인 API
  const googleLoginMutation = useMutation({
    mutationFn: googleAuthApi,

    onSuccess: async (data) => {
      // API 완료 시 pending ref 해제
      googleLoginPendingRef.current = false

      if (!data.success) {
        alert(data.error || '구글 로그인에 실패했습니다.')
        return
      }

      // 신규 유저면 회원가입 페이지로 이동
      if (data.isNewUser && data.data?.user) {
        sessionStorage.setItem(
          'googleSignupUser',
          JSON.stringify({
            email: data.data.user.email,
            googleUid: data.data.user.google_uid,
          })
        )

        alert('추가 정보 입력 후 회원가입을 완료해주세요.')
        goSignup()
        return
      }

      // 기존 유저면 로그인 완료 처리
      try {
        const user = await getMyInfoApi()

        // 구글 로그인 응답 이름을 새로고침용으로도 저장
        const googleUser = data.data?.user
        const displayName =
          user.name || googleUser?.name || user.email?.split('@')[0] || '사용자'

        localStorage.setItem('displayName', displayName)

        setCurrentUser({
          id: typeof user.id === 'number' ? user.id : undefined,
          uuid: user.uuid || '',
          name: displayName,
          position: user.position || '',
          avatar: user.avatar || '',
          email: user.email || googleUser?.email || '',
          phone: user.phone || '',
          github: user.github || '',
        })

      } catch {
        alert('구글 로그인은 성공했지만 유저 정보 조회에 실패했습니다.')
      }
    },

    onError: (error) => {
      // API 실패 시 pending ref 해제
      googleLoginPendingRef.current = false

      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.error || '구글 로그인에 실패했습니다.')
        return
      }

      alert('구글 로그인에 실패했습니다.')
    },
  })

  // mutate 함수를 ref에 동기화 (매 렌더마다 최신 mutate 유지)
  useEffect(() => {
    googleLoginMutateRef.current = googleLoginMutation.mutate
  }, [googleLoginMutation.mutate])

  // --- [4] 이벤트 핸들러 ---
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault() // 폼 제출 시 페이지 새로고침 방지
    if (!isValid) return // 유효하지 않으면 뮤테이션 실행 안 함

    loginMutation.mutate({
      email,
      password,
    })
  }

  // 구글 버튼 클릭 �핸들러
  const handleGoogleLogin = () => {
    if (!window.google) return
    if (googleLoginPendingRef.current) return
    if (!googleClientId) return

    // initialize 전 cancel() 호출 → 이전 세션/자동로그인 완전 정리 (콜백 2중 실행 방지 핵심)
    window.google.accounts.id.cancel()

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response: { credential: string }) => {
        if (!response.credential) {
          alert('구글 토큰을 받지 못했습니다.')
          return
        }

        // 중복 호출 방지 (pending ref 체크)
        if (googleLoginPendingRef.current) return
        googleLoginPendingRef.current = true

        // 서버에 구글 토큰 전달
        googleLoginMutateRef.current?.({ googleToken: response.credential })
      },
      // auto_select 비활성화 → 자동 로그인 시도 차단 (자동+수동 2중 콜백 방지)
      auto_select: false,
      cancel_on_tap_outside: true,
      ux_mode: 'popup',
    })

    window.google.accounts.id.prompt()
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로그인 페이지 헤더 */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/20">
            <LogIn size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic">
            i-Station
          </h1>
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-widest opacity-80 mt-1">
            개인 계정 로그인
          </p>
        </div>

        {/* 로그인 카드 */}
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
                className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                placeholder="mail@istation.dev"
              />
            </div>

            {/* 비밀번호 입력 */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-2">
                <Lock size={12} /> 비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                placeholder="비밀번호 입력"
              />
            </div>

            {/* 일반 로그인 버튼 */}
            <button
              type="submit"
              disabled={!isValid || loginMutation.isPending}
              className={`w-full font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl text-lg transition-colors ${
                isValid && !loginMutation.isPending
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              {loginMutation.isPending ? '로그인 중...' : '시작하기'}
              <ChevronRight size={20} />
            </button>

            {/* 구글 로그인 커스텀 버튼 (클릭 시 cancel → initialize → prompt 순서로 실행) */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoginMutation.isPending}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-full border border-gray-300 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* 구글 로고 SVG */}
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoginMutation.isPending ? '로그인 중...' : 'Google로 로그인'}
            </button>

            {/* 회원가입 이동 버튼 */}
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
