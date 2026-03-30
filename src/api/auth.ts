import type { CurrentUser } from "../types"
import { api } from './client'

// 로그인 요청 body 타입
export interface LoginRequest {
  email: string
  password: string
}

// 회원가입 요청 body 타입
export interface SignupRequest {
  email: string
  password: string
  name: string
  phone: string
  github_url?: string
}

// 회원가입 성공/실패 응답 타입
export interface SignupResponse {
  success: boolean
  data: {
    uuid: string
  } | null
  meta: null
  error: string | null
}

// 로그인 성공 시 내려오는 유저 정보 타입
export interface LoginUser {
  uuid: string
  name: string
  profile_image: string | null
}

// 로그인 성공/실패 응답 타입
export interface LoginResponse {
  success: boolean
  data: {
    token: string
    user: LoginUser
  } | null
  meta: null
  error: string | null
}

// 로그아웃 성공/실패 응답 타입
export interface LogoutResponse {
  success: boolean
  data: {
    message: string
  } | null
  meta?: null
  error: string | null
}

// 회원가입 API 호출
export const signupApi = async (
  data: SignupRequest
): Promise<SignupResponse> => {
  const res = await api.post('/auth/signup', data)
  return res.data
}

// 로그인 API 호출
export const loginApi = async (
  data: LoginRequest
): Promise<LoginResponse> => {
  const res = await api.post('/auth/login', data)
  return res.data
}


// 로그아웃 API 호출
export const logoutApi = async (): Promise<LogoutResponse> => {
  const res = await api.post('/auth/logout', {}, { withCredentials: true })
  return res.data
}

// 로그인한 유저 정보 조회 api 호출
export const getMyInfoApi = async (): Promise<CurrentUser> => {
  const response = await api.get('/users/me');
  return response.data.data; 
};