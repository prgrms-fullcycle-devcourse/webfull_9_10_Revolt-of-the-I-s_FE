/**
 * 칸반보드 Task CRUD 관련 API 호출 함수
 */

import { api } from './client'

// 요청 데이터 타입 정의
export interface CreateTicketRequest {
  title: string;
  content: string;
  worker_id: string;
}

// 응답 데이터 타입 정의
export interface TicketResponse {
  id: number;
  title: string;
  content: string;
  worker_id: number;
  status: string;
  createdAt: string;
}

// 새 테스크 생성 api
export const createTicketApi = async (teamId: number, data: CreateTicketRequest) => {
  const response = await api.post(`/teams/${teamId}/tasks`, data);
  return response.data;
};