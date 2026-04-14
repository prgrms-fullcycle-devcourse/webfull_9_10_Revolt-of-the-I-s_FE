import { googleAuthApi, googleSignupApi, signupApi } from '../api/auth'
import type { GoogleAuthResponse } from '../types'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  UserPlus,
  User,
  Phone,
  AtSign,
  Lock,
  Github,
  ChevronRight,
} from 'lucide-react'
import axios from 'axios'

interface SignupProps {
  goLogin: () => void
}

type GoogleSignupUser = {
  email: string
  googleUid: string
}

const getSavedGoogleSignupUser = (): GoogleSignupUser | null => {
  try {
    const saved = sessionStorage.getItem('googleSignupUser')
    if (!saved) return null
    return JSON.parse(saved)
  } catch {
    sessionStorage.removeItem('googleSignupUser')
    return null
  }
}

export const Signup = ({ goLogin }: SignupProps) => {
  const savedGoogleUser = getSavedGoogleSignupUser()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState(savedGoogleUser?.email || '')
  const [password, setPassword] = useState('')
  const [passwordCheck, setPasswordCheck] = useState('')
  const [github, setGithub] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  // 이미지가 없을 때 사용할 기본 프로필 이미지 목록
  const DEFAULT_PROFILE_IMAGES = [
    '/avatars/avatar1.png',
    '/avatars/avatar2.png',
    '/avatars/avatar3.png',
    '/avatars/avatar4.png',
  ]

  // 구글 회원가입용 임시 유저 정보
  const [googleSignupUser, setGoogleSignupUser] = useState<GoogleSignupUser | null>(
    savedGoogleUser
  )

  const [profileImage, setProfileImage] = useState<File | null>(null)

  // 이미 가입된 구글 계정 여부 (true면 구글 버튼 숨기고 로그인 안내)
  const [isAlreadyGoogleUser, setIsAlreadyGoogleUser] = useState(false)

  // 콜백 클로저에서 최신 googleSignupUser를 참조하기 위한 ref (state와 항상 동기화)
  const googleSignupUserRef = useRef<GoogleSignupUser | null>(savedGoogleUser)

  // 콜백 클로저에서 중복 호출을 막기 위한 pending ref
  const googleCheckPendingRef = useRef(false)

  // googleCheckMutation.mutate를 ref로 분리 → 의존성 없이 최신 함수 참조
  const googleCheckMutateRef = useRef<((data: { googleToken: string }) => void) | null>(null)

  const googleButtonRef = useRef<HTMLDivElement | null>(null)

  const nameRegex = /^[가-힣a-zA-Z]{2,20}$/
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

  const onlyPhone = phone.replace(/\D/g, '').slice(0, 11)
  const isPhonePrefixValid = onlyPhone.startsWith('010')
  const isPhoneLengthValid = onlyPhone.length === 11

  const isNameValid = nameRegex.test(name.trim())
  const isPhoneValid = isPhonePrefixValid && isPhoneLengthValid
  const isEmailValid = emailRegex.test(email.trim())


  const isPasswordValid = passwordRegex.test(password)

  const isPasswordMatch = useMemo(() => {
    if (!passwordCheck) return true
    return password === passwordCheck
  }, [password, passwordCheck])

  const isValid = googleSignupUser
    ? isNameValid && isPhoneValid && isEmailValid
    : isNameValid &&
      isPhoneValid &&
      isEmailValid &&
      isPasswordValid &&
      passwordCheck.trim() !== '' &&
      isPasswordMatch

  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim().replace(/^"(.*)"$/, '$1')

  const signupMutation = useMutation({
    mutationFn: signupApi,
    onSuccess: (data) => {
      if (!data.success) {
        setErrorMessage(data.error || '회원가입에 실패했습니다.')
        return
      }

      setErrorMessage('')
      goLogin()
    },
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

  // 구글 OAuth 회원가입 여부 확인 API
  const googleCheckMutation = useMutation({
    mutationFn: googleAuthApi,
    onSuccess: (data: GoogleAuthResponse) => {
      // API 완료 시 pending ref 해제
      googleCheckPendingRef.current = false

      if (!data.success) {
        setErrorMessage(data.error || '구글 회원가입에 실패했습니다.')
        return
      }

      if (!data.isNewUser) {
        // 기존 구글 유저면 회원가입용 상태 제거
        setGoogleSignupUser(null)
        googleSignupUserRef.current = null
        sessionStorage.removeItem('googleSignupUser')

        setIsAlreadyGoogleUser(true)
        setErrorMessage('이미 가입된 구글 계정입니다. 로그인 페이지에서 구글 로그인을 이용해주세요.')
        return
      }

      if (!data.data?.user) {
        setErrorMessage('구글 사용자 정보를 가져오지 못했습니다.')
        return
      }

      // 기존 구글 유저 안내 상태 해제
      setIsAlreadyGoogleUser(false)

      const nextGoogleUser = {
        email: data.data.user.email,
        googleUid: data.data.user.google_uid,
      }

      // state와 ref 동시 업데이트 (콜백 클로저에서도 즉시 최신 값 참조 가능)
      setGoogleSignupUser(nextGoogleUser)
      googleSignupUserRef.current = nextGoogleUser
      setEmail(nextGoogleUser.email)
      setErrorMessage('')

      sessionStorage.setItem('googleSignupUser', JSON.stringify(nextGoogleUser))
    },
    onError: (error) => {
      // API 실패 시 pending ref 해제
      googleCheckPendingRef.current = false

      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.error || '구글 회원가입에 실패했습니다.'
        )
        return
      }

      setErrorMessage('구글 회원가입에 실패했습니다.')
    },
  })

  // mutate 함수를 ref에 동기화 (매 렌더마다 최신 mutate 유지)
  useEffect(() => {
    googleCheckMutateRef.current = googleCheckMutation.mutate
  }, [googleCheckMutation.mutate])

  // 구글 회원가입 완료 API
  const googleCompleteSignupMutation = useMutation({
    mutationFn: googleSignupApi,
    onSuccess: (data) => {
      if (!data.success) {
        setErrorMessage(data.error || '구글 회원가입 완료에 실패했습니다.')
        return
      }

      sessionStorage.removeItem('googleSignupUser')
      setErrorMessage('')
      goLogin()
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const message = error.response?.data?.error

        if (status === 409) {
          setGoogleSignupUser(null)
          googleSignupUserRef.current = null
          sessionStorage.removeItem('googleSignupUser')
          setErrorMessage(message || '이미 가입된 이메일입니다. 기존 계정으로 로그인해주세요.')
          return
        }

        setErrorMessage(message || '구글 회원가입 완료에 실패했습니다.')
        return
      }

      setErrorMessage('구글 회원가입 완료에 실패했습니다.')
    },
  })

  // 구글 버튼 클릭 시 initialize() + prompt() 실행 (클릭마다 새로 초기화 → 콜백 누적 없음)
  useEffect(() => {
    if (!window.google || !googleClientId || !googleButtonRef.current) return
    if (googleSignupUser || isAlreadyGoogleUser) return

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response: { credential: string }) => {
        if (!response.credential) {
          setErrorMessage('구글 토큰을 받지 못했습니다.')
          return
        }

        if (googleSignupUserRef.current || googleCheckPendingRef.current) return
        googleCheckPendingRef.current = true
        googleCheckMutateRef.current?.({ googleToken: response.credential })
      },
      ux_mode: 'popup',
      cancel_on_tap_outside: false,
    })

    googleButtonRef.current.innerHTML = ''

    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: 'outline',
      size: 'large',
      text: 'signup_with',
      shape: 'pill',
      width: 360,
      logo_alignment: 'left',
    })
  }, [googleClientId, googleSignupUser, isAlreadyGoogleUser])

  const handlePhoneChange = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11)
    setPhone(numbers)
  }

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 첫 번째 이미지 1장만 저장
    const file = e.target.files?.[0] || null
    setProfileImage(file)
  }

  const getRandomProfileImageFile = async (): Promise<File | null> => {
    try {
      // 랜덤 이미지 하나 선택
      const randomImage =
        DEFAULT_PROFILE_IMAGES[
          Math.floor(Math.random() * DEFAULT_PROFILE_IMAGES.length)
        ]

      // 이미지 파일 받아오기
      const response = await fetch(randomImage)
      const blob = await response.blob()

      // File 객체로 변환
      return new File([blob], 'random-profile.png', { type: blob.type })
    } catch {
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formattedPhone = `${onlyPhone.slice(0, 3)}-${onlyPhone.slice(3, 7)}-${onlyPhone.slice(7, 11)}`

    if (googleSignupUser) {
      if (!isValid || googleCompleteSignupMutation.isPending) return

      setErrorMessage('')

      const imageToUpload = profileImage || (await getRandomProfileImageFile())

      googleCompleteSignupMutation.mutate({
        email: email.trim(),
        googleUid: googleSignupUser.googleUid,
        name: name.trim(),
        phone: formattedPhone,
        profileImage: imageToUpload,
        github_url: github.trim() || undefined,
      })
      return
    }

    if (!isValid || signupMutation.isPending) return

    // 일반 회원가입 시 기존 구글 유저 안내 상태 해제
    setIsAlreadyGoogleUser(false)
    setErrorMessage('')

    // 사용자가 이미지를 안 골랐으면 랜덤 이미지 사용
    const imageToUpload = profileImage || (await getRandomProfileImageFile())

    signupMutation.mutate({
      name: name.trim(),
      phone: formattedPhone,
      email: email.trim(),
      password,
      github_url: github.trim() || undefined,
      profileImage: imageToUpload,
    })
  }

  // 구글 회원가입
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
          <h1 className="text-4xl font-black text-white tracking-tighter italic">
            i-Station
          </h1>
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
                <p className="text-xs text-red-400 ml-1">
                  전화번호는 숫자 11자리여야 합니다.
                </p>
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
                readOnly={!!googleSignupUser}
                className={`w-full bg-slate-800/50 border rounded-2xl px-6 py-4 text-white text-sm outline-none focus:ring-2 ${
                  email && !isEmailValid
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-white/5 focus:ring-blue-500'
                } ${googleSignupUser ? 'opacity-70 cursor-not-allowed' : ''}`}
                placeholder="mail@istation.dev"
              />
             {/* 구글 이메일 입력 시 일반 회원가입이 아닌 구글 로그인 안내 */}
              {email &&
                !googleSignupUser &&
                /@(gmail\.com|googlemail\.com)$/i.test(email.trim()) && (
                  <p className="text-xs text-red-400 ml-1">
                    구글 이메일은 구글 로그인을 이용해 주세요.
                  </p>
                )}
            </div>

            {!googleSignupUser && (
              <>
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
                    <p className="text-xs text-red-400 ml-1">
                      비밀번호가 일치하지 않습니다.
                    </p>
                  )}
                  {passwordCheck && isPasswordMatch && (
                    <p className="text-xs text-green-400 ml-1">
                      비밀번호가 일치합니다.
                    </p>
                  )}
                </div>
              </>
            )}

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

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-2">
                <User size={12} /> 프로필 이미지 (선택)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-xs text-slate-400 ml-1">
                이미지 파일은 1장만 업로드할 수 있습니다.
              </p>
            </div>

            {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}

            <button
              type="submit"
              disabled={
                isAlreadyGoogleUser ||
                !isValid ||
                signupMutation.isPending ||
                googleCompleteSignupMutation.isPending
              }
              className={`w-full font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl text-lg transition-all ${
                !isAlreadyGoogleUser &&
                isValid &&
                !signupMutation.isPending &&
                !googleCompleteSignupMutation.isPending
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isAlreadyGoogleUser
                ? '기존 구글 계정'
                : googleSignupUser
                  ? googleCompleteSignupMutation.isPending
                    ? '가입 중...'
                    : '구글 회원가입 완료'
                  : signupMutation.isPending
                    ? '가입 중...'
                    : '가입하기'}
              <ChevronRight size={20} />
            </button>

            {/* 구글 회원가입 버튼 - 이미 가입된 계정이면 숨김 */}
            {!googleSignupUser && !isAlreadyGoogleUser && (
              <div className="w-full flex justify-center">
                <div
                  ref={googleButtonRef}
                  onClick={handleGoogleSignup}
                  className={googleCheckMutation.isPending ? 'pointer-events-none opacity-50' : ''}
                />
              </div>
            )}

            {/* 이미 가입된 구글 계정 → 로그인 페이지 이동 안내 버튼 */}
            {isAlreadyGoogleUser && (
              <button
                type="button"
                onClick={goLogin}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-full shadow-sm transition-colors"
              >
                로그인 페이지로 이동하기
              </button>
            )}

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
