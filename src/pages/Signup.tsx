import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { UserPlus, User, Phone, AtSign, Lock, Github, ChevronRight } from 'lucide-react'
import { signupApi } from '../api/auth'
import axios from 'axios'

interface SignupProps {
  goLogin: () => void
}

export const Signup = ({ goLogin }: SignupProps) => {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordCheck, setPasswordCheck] = useState('')
  const [github, setGithub] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const nameRegex = /^[가-힣a-zA-Z]{2,20}$/
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

  const onlyPhone = phone.replace(/\D/g, '').slice(0, 11)

  const isNameValid = nameRegex.test(name.trim())
  const isPhoneValid = onlyPhone.length === 11
  const isEmailValid = emailRegex.test(email.trim())
  const isPasswordValid = passwordRegex.test(password)

  const isPasswordMatch = useMemo(() => {
    if (!passwordCheck) return true
    return password === passwordCheck
  }, [password, passwordCheck])

  const isValid =
    isNameValid &&
    isPhoneValid &&
    isEmailValid &&
    isPasswordValid &&
    passwordCheck.trim() !== '' &&
    isPasswordMatch

  const signupMutation = useMutation({
    mutationFn: signupApi,

    // 회원가입 성공
    onSuccess: (data) => {

      // success가 false면 서버에서 실패 응답을 준 경우
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

      // axios 에러인지 확인 후 서버 에러 문구 사용
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.error || '회원가입에 실패했습니다.'
        )
        return
      }
      // 그 외 에러
      setErrorMessage('회원가입에 실패했습니다.')
    },
  })

  const handlePhoneChange = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11)
    setPhone(numbers)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isValid || signupMutation.isPending) return

    setErrorMessage('')

    // 서버 요청 형식에 맞게 하이픈 포함 전화번호로 변환
    const formattedPhone = `${onlyPhone.slice(0, 3)}-${onlyPhone.slice(3, 7)}-${onlyPhone.slice(7, 11)}`

    signupMutation.mutate({
      name: name.trim(),
      phone: formattedPhone,
      email: email.trim(),
      password,
      github_url: github.trim() || undefined,
    })
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