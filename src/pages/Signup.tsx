import { googleAuthApi, signupApi } from '../api/auth'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { UserPlus, User, Phone, AtSign, Lock, Github, ChevronRight } from 'lucide-react'
import axios from 'axios'

interface SignupProps {
  goLogin: () => void
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

export const Signup = ({ goLogin }: SignupProps) => {
  // 입력값 상태
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordCheck, setPasswordCheck] = useState('')
  const [github, setGithub] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // 구글 버튼이 들어갈 영역
  const googleButtonRef = useRef<HTMLDivElement | null>(null)

  // 구글 버튼 렌더링 ref
  const googleInitializedRef = useRef(false)

  // 유효성 검사 정규식
  const nameRegex = /^[가-힣a-zA-Z]{2,20}$/
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

  // 전화번호 숫자만 추출
  const onlyPhone = phone.replace(/\D/g, '').slice(0, 11)

  // 전화번호가 010으로 시작하는지 확인
  const isPhonePrefixValid = onlyPhone.startsWith('010')

  // 전화번호가 11자리인지 확인
  const isPhoneLengthValid = onlyPhone.length === 11

  // 각 입력값 유효성 검사
  const isNameValid = nameRegex.test(name.trim())
  const isPhoneValid = isPhonePrefixValid && isPhoneLengthValid
  const isEmailValid = emailRegex.test(email.trim())
  const isPasswordValid = passwordRegex.test(password)

  // 비밀번호 확인 일치 여부
  const isPasswordMatch = useMemo(() => {
    if (!passwordCheck) return true
    return password === passwordCheck
  }, [password, passwordCheck])

  // 전체 입력 유효성 검사
  const isValid =
    isNameValid &&
    isPhoneValid &&
    isEmailValid &&
    isPasswordValid &&
    passwordCheck.trim() !== '' &&
    isPasswordMatch

  // 구글 클라이언트 ID 정리
  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim().replace(/^"(.*)"$/, '$1')  

  // 일반 회원가입 API
  const signupMutation = useMutation({
    mutationFn: signupApi,

    // 회원가입 성공
    onSuccess: (data) => {
      if (!data.success) {
        setErrorMessage(data.error || '회원가입에 실패했습니다.')
        return
      }

      setErrorMessage('')
      alert('회원가입이 완료되었습니다.')
      goLogin()
    },

    // 회원가입 실패
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.error || '회원가입에 실패했습니다.'
        )
        return
      }

      setErrorMessage('회원가입에 실패했습니다.')
    },
  })

  // 구글 OAuth 회원가입 / 로그인 API
  const googleSignupMutation = useMutation({
    mutationFn: googleAuthApi,

    // 200 성공 응답 처리
    onSuccess: (data) => {
      if (!data.success) {
        setErrorMessage(data.error || '구글 회원가입에 실패했습니다.')
        return
      }

      setErrorMessage('')
      alert('구글 회원가입 성공')
      goLogin()
    },

    // 409, 500 등 에러 응답 처리
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const message = error.response?.data?.error

        // 이미 자체 이메일로 가입된 계정
        if (status === 409) {
          setErrorMessage(message || '이미 자체 이메일로 가입된 계정입니다.')
          return
        }

        setErrorMessage(message || '구글 회원가입에 실패했습니다.')
        return
      }

      setErrorMessage('구글 회원가입에 실패했습니다.')
    },
  })

  // 구글 회원가입 성공 후 googleToken을 서버로 보내는 함수
  const handleGoogleCredential = useCallback((response: GoogleCredentialResponse) => {
    // 토큰이 없으면 종료
    if (!response.credential) {
      setErrorMessage('구글 토큰을 받지 못했습니다.')
      return
    }

    // 기존 에러 메시지 초기화
    setErrorMessage('')

    // 서버에 구글 토큰 전달
    googleSignupMutation.mutate({
      googleToken: response.credential,
    })
  }, [googleSignupMutation])

  // 전화번호 입력 시 숫자만 허용
  const handlePhoneChange = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11)
    setPhone(numbers)
  }

  // 일반 회원가입 제출
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isValid || signupMutation.isPending) return

    setErrorMessage('')

    // 서버 요청 형식에 맞게 전화번호 포맷팅
    const formattedPhone = `${onlyPhone.slice(0, 3)}-${onlyPhone.slice(3, 7)}-${onlyPhone.slice(7, 11)}`

    signupMutation.mutate({
      name: name.trim(),
      phone: formattedPhone,
      email: email.trim(),
      password,
      github_url: github.trim() || undefined,
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
    window.__googleGsiCallback = handleGoogleCredential

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

    // 현재 페이지에 구글 회원가입 버튼 다시 렌더링
    window.google.accounts.id.renderButton(googleButton, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signup_with',
      shape: 'pill',
      width: 460,
      logo_alignment: 'left',
    })

    // 현재 페이지 버튼 렌더링 완료 체크
    googleInitializedRef.current = true
  }, [googleClientId, handleGoogleCredential])

  // 구글 회원가입 버튼 클릭
  const handleGoogleSignup = () => {
    setErrorMessage('')
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/20">
            <UserPlus size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic">i-Station</h1>
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-widest opacity-80 mt-1">
            회원가입
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-2">
                <User size={12} /> 이름
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full bg-slate-800/50 border rounded-2xl px-6 py-4 text-white text-sm outline-none focus:ring-2 ${
                  name && !isNameValid
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-white/5 focus:ring-blue-500'
                }`}
                placeholder="이름 입력"
              />
              {name && !isNameValid && (
                <p className="text-xs text-red-400 ml-1">
                  이름은 한글/영문 2~20자만 입력 가능합니다.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-2">
                <Phone size={12} /> 전화번호
              </label>
              <input
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={`w-full bg-slate-800/50 border rounded-2xl px-6 py-4 text-white text-sm outline-none focus:ring-2 ${
                  phone && !isPhoneValid
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-white/5 focus:ring-blue-500'
                }`}
                placeholder="01012345678"
              />
              {phone && !isPhonePrefixValid && (
                <p className="text-xs text-red-400 ml-1">전화번호 형식이 틀립니다.</p>
              )}
              {phone && !isPhoneValid && (
                <p className="text-xs text-red-400 ml-1">전화번호는 숫자 11자리여야 합니다.</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-2">
                <AtSign size={12} /> 이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full bg-slate-800/50 border rounded-2xl px-6 py-4 text-white text-sm outline-none focus:ring-2 ${
                  email && !isEmailValid
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-white/5 focus:ring-blue-500'
                }`}
                placeholder="mail@istation.dev"
              />
              {email && !isEmailValid && (
                <p className="text-xs text-red-400 ml-1">올바른 이메일 형식을 입력해주세요.</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-2">
                <Lock size={12} /> 비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full bg-slate-800/50 border rounded-2xl px-6 py-4 text-white text-sm outline-none focus:ring-2 ${
                  password && !isPasswordValid
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-white/5 focus:ring-blue-500'
                }`}
                placeholder="비밀번호 입력"
              />
              {password && !isPasswordValid && (
                <p className="text-xs text-red-400 ml-1">
                  비밀번호는 영문, 숫자, 특수문자를 포함한 8자 이상이어야 합니다.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-2">
                <Lock size={12} /> 비밀번호 확인
              </label>
              <input
                type="password"
                value={passwordCheck}
                onChange={(e) => setPasswordCheck(e.target.value)}
                className={`w-full bg-slate-800/50 border rounded-2xl px-6 py-4 text-white text-sm outline-none focus:ring-2 ${
                  passwordCheck && !isPasswordMatch
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-white/5 focus:ring-blue-500'
                }`}
                placeholder="비밀번호 다시 입력"
              />
              {passwordCheck && !isPasswordMatch && (
                <p className="text-xs text-red-400 ml-1">비밀번호가 일치하지 않습니다.</p>
              )}
              {passwordCheck && isPasswordMatch && (
                <p className="text-xs text-green-400 ml-1">비밀번호가 일치합니다.</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-2">
                <Github size={12} /> 깃허브 (선택)
              </label>
              <input
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                placeholder="https://github.com/..."
              />
            </div>

            {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}

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

            {/* 구글 회원가입 버튼 영역 */}
            <div
              onClick={handleGoogleSignup}
              className="flex justify-center"
            >
              <div ref={googleButtonRef} />
            </div>

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