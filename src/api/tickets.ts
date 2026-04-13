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

// 테스크 목록 조회 api
export const getTicketsApi = async (teamId: number) => {
  const response = await api.get(`/teams/${teamId}/tasks`);
  return response.data;
};

// 새 테스크 생성 api
export const createTicketApi = async (teamId: number, data: CreateTicketRequest) => {
  const response = await api.post(`/teams/${teamId}/tasks`, data);
  return response.data;
};

// 테스크 상세 조회 api
export const getTicketDetailApi = async (taskId: number) => {
  const response = await api.get(`/tasks/${taskId}`);
  return response.data;
};

// 테스크 삭제 api
export const deleteTicketApi = async (taskId: number) => {
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};

// 테스크 상태 변경 api
export const acceptTicketApi = (taskId: number) => api.post(`/tasks/${taskId}/accept`);
export const submitTicketApi = (taskId: number) => api.post(`/tasks/${taskId}/submit`);
export const confirmTicketApi = (taskId: number) => api.post(`/tasks/${taskId}/confirm`);
export const rejectTicketApi = (taskId: number) => api.post(`/tasks/${taskId}/reject`);

// 테스크 수정 api
export const UpdateTicketApi = async (taskId: number, data: { title: string; content: string; worker_id: string }) => {
  const response = await api.patch(`/tasks/${taskId}`, data);
  return response.data;
}