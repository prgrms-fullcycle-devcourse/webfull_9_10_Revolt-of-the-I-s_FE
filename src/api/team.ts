import { api } from './client'
import type {
  GetTeamsResponse,
  CreateTeamRequest,
  CreateTeamResponse,
  JoinTeamRequest,
  JoinTeamResponse,
  LeaveTeamResponse,
} from '../types'

// GET /teams - 팀 목록 전체 조회
export const getTeamsApi = async (): Promise<GetTeamsResponse> => {
  const res = await api.get('/teams')
  return res.data
}

// POST /teams - 팀 생성
export const createTeamApi = async (
  data: CreateTeamRequest
): Promise<CreateTeamResponse> => {
  const res = await api.post('/teams', data)
  return res.data
}

/**
 * POST /teams/{teamId}/members - 팀 가입/입장
 * @param teamId - 입장할 팀 ID
 * @param data   - { password: string, userId: number } (현재 로그인한 유저 ID)
 */
export const joinTeamApi = async (
  teamId: string,
  data: JoinTeamRequest
): Promise<JoinTeamResponse> => {
  // Swagger 기준 팀 가입/입장 경로로 수정
  const res = await api.post(`/teams/${teamId}/members`, data)
  return res.data
}

// DELETE /teams/{teamId}/members/me - 팀 탈퇴
export const leaveTeamApi = async (
  teamId: number
): Promise<LeaveTeamResponse> => {
  const res = await api.delete(`/teams/${teamId}/members/me`)
  return res.data
}