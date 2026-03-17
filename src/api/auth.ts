/**
 * [API] 사용자 인증 및 세션 관리
 * @description 로그인, 회원가입, 토큰 검증 등 인증 관련 백엔드 통신을 전담합니다.
 * TODO: 백엔드 API 명세서 수령 후 엔드포인트 및 DTO 정의 필요
 */


import { api } from './client'

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  name: string
  phone: string
  email: string
  password: string
  github?: string 
}

export interface AuthUser {
  name: string
  email: string
  position: string
  github: string
  avatar: string
}

const USE_MOCK = true

export const loginApi = async (data: LoginRequest): Promise<AuthUser> => {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return {
      name: data.email.split('@')[0],
      email: data.email,
      position: '',
      github: '',
      avatar: '',
    }
  }

  const res = await api.post('/auth/login', data)
  return res.data
}

export const signupApi = async (data: SignupRequest): Promise<AuthUser> => {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return {
      name: data.name,
      email: data.email,
      position: '',
      github: '',
      avatar: '',
    }
  }

  const res = await api.post('/auth/signup', data)
  return res.data
}