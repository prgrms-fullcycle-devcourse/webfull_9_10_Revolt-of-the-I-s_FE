import { useCallback, useEffect, useRef, useState } from 'react'
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

// 구글 SDK 응답 타입
interface GoogleCredentialResponse {
  credential: string
}

// 구글 accounts.id 타입
interface GoogleAccountsId {
  initialize: (config: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
  }) => void
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: string
      theme?: string
      size?: string
      text?: string
      shape?: string
      width?: number
      logo_alignment?: string
    }
  ) => void
}

// window.google 타입
interface GoogleWindow {
  accounts: {
    id: GoogleAccountsId
  }
}

declare global {
  interface Window {
    google: GoogleWindow
    // 구글 SDK 전역 초기화 여부 저장
    __googleGsiInitialized?: boolean
    // 현재 페이지에서 사용할 구글 콜백 저장
    __googleGsiCallback?: (response: GoogleCredentialResponse) => void
  }
}

export const Login = ({ setCurrentUser, goSignup }: LoginProps) => {
  // --- [1] 상태 관리 (Form State) ---
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // 구글 버튼이 그려질 영역 ref
  const googleButtonRef = useRef<HTMLDivElement | null>(null)

  // 구글 버튼 렌더링 ref
  const googleInitializedRef = useRef(false)

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

    setCurrentUser({
      uuid: user.uuid,
      name: user.name,
      position: '',
      avatar: user.profile_image || randomAvatar,
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
      if (!data.success) {
        alert(data.error || '구글 로그인에 실패했습니다.')
        return
      }

      try {
        const user = await getMyInfoApi()

        setCurrentUser({
        // 숫자 id는 숫자일 때만 사용
        id: typeof user.id === 'number' ? user.id : undefined,
        // 문자열 uuid는 uuid 필드에 저장
        uuid: user.uuid || '',
        name: user.name || '',
        position: user.position || '',
        avatar: user.avatar || '',
        email: user.email || '',
        phone: user.phone || '',
        github: user.github || '',
      })

        alert('구글 로그인 성공')
      } catch {
        alert('구글 로그인은 성공했지만 유저 정보 조회에 실패했습니다.')
      }
    },

    // 구글 로그인 실패
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.error || '구글 로그인에 실패했습니다.')
        return
      }

      alert('구글 로그인에 실패했습니다.')
    },
  })

  // 구글 로그인 성공 후 googleToken을 서버로 보내는 함수
  const handleGoogleLogin = useCallback((response: GoogleCredentialResponse) => {
    // 토큰이 없으면 종료
    if (!response.credential) {
      alert('구글 토큰을 받지 못했습니다.')
      return
    }

    // 서버에 구글 토큰 전달
    googleLoginMutation.mutate({
      googleToken: response.credential,
    })
  }, [googleLoginMutation])

  // --- [4] 이벤트 핸들러 ---
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault() // 폼 제출 시 페이지 새로고침 방지
    if (!isValid) return // 유효하지 않으면 뮤테이션 실행 안 함

    loginMutation.mutate({
      email,
      password,
    })
  }

  useEffect(() => {
    // 구글 SDK 없으면 종료
    if (!window.google) return

    // 버튼 영역 저장
    const googleButton = googleButtonRef.current

    // 버튼 영역 없으면 종료
    if (!googleButton) return

    // 클라이언트 ID 없으면 종료
    if (!googleClientId) return

    // 현재 페이지에서 사용할 콜백 저장
    window.__googleGsiCallback = handleGoogleLogin

    // 앱 전체에서 구글 SDK는 한 번만 초기화
    if (!window.__googleGsiInitialized) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        // 전역 콜백을 통해 현재 페이지 콜백 실행
        callback: (response: GoogleCredentialResponse) => {
          window.__googleGsiCallback?.(response)
        },
      })

      // 전역 초기화 완료 처리
      window.__googleGsiInitialized = true
    }

    // 현재 버튼 영역 비우기
    googleButton.innerHTML = ''

    // 현재 페이지에 구글 로그인 버튼 다시 렌더링
    window.google.accounts.id.renderButton(googleButton, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'pill',
      width: 460,
      logo_alignment: 'left',
    })

    // 현재 페이지 버튼 렌더링 완료 체크
    googleInitializedRef.current = true
  }, [googleClientId, handleGoogleLogin])

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
                className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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
                className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="비밀번호 입력"
              />
            </div>

            {/* 일반 로그인 버튼 */}
            <button
              type="submit"
              disabled={!isValid || loginMutation.isPending}
              className={`w-full font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl text-lg transition-all ${
                isValid && !loginMutation.isPending
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              {loginMutation.isPending ? '로그인 중...' : '시작하기'}
              <ChevronRight size={20} />
            </button>

            {/* 구글 공식 로그인 버튼 자리 */}
            <div className="flex justify-center">
              <div ref={googleButtonRef} />
            </div>

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