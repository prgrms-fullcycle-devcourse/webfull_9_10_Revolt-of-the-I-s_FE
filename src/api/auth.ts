import type {
  CurrentUser,
  GoogleAuthRequest,
  GoogleAuthResponse,
  GoogleSignupRequest,
  GoogleSignupResponse,
} from "../types"
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
  profileImage?: File | null
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
  // 회원가입 데이터는 FormData로 전송
  const formData = new FormData()
  formData.append('email', data.email)
  formData.append('password', data.password)
  formData.append('name', data.name)
  formData.append('phone', data.phone)

  // 선택 입력값이 있으면 같이 전송
  if (data.github_url) {
    formData.append('github_url', data.github_url)
  }

  // 이미지가 있으면 1장만 전송
  if (data.profileImage) {
    formData.append('profileImage', data.profileImage)
  }

  const res = await api.post('/auth/signup', formData)

  return res.data
}

// 로그인 API 호출
export const loginApi = async (
  data: LoginRequest
): Promise<LoginResponse> => {
  const res = await api.post('/auth/login', data)
  return res.data
}

// 구글 로그인 / 회원가입 여부 확인 API 호출
export const googleAuthApi = async (
  data: GoogleAuthRequest
): Promise<GoogleAuthResponse> => {
  const res = await api.post('/auth/google', data)
  return res.data
}

// 구글 회원가입 완료 API 호출
export const googleSignupApi = async (
  data: GoogleSignupRequest
): Promise<GoogleSignupResponse> => {
  const formData = new FormData()
  formData.append('email', data.email)
  formData.append('googleUid', data.googleUid)
  formData.append('name', data.name)
  formData.append('phone', data.phone)

  if (data.github_url) {
    formData.append('github_url', data.github_url)
  }

  if (data.profileImage) {
    formData.append('profileImage', data.profileImage)
  }

  const res = await api.post('/auth/google/signup', formData)
  return res.data
}

// 로그아웃 API 호출
export const logoutApi = async (): Promise<LogoutResponse> => {
  const res = await api.post('/auth/logout', {}, { withCredentials: true })
  return res.data
}

// 로그인한 유저 정보 조회 api 호출
export const getMyInfoApi = async (): Promise<CurrentUser> => {
  const response = await api.get('/users/me')
  return response.data.data
}