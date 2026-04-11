/**
 팀원 정보 관련 API 모음
 */

import type { GetOnlineUsersResponse } from "../types";
import { api } from './client';

// 요청 데이터 타입 정의
export interface EditMemberPositionRequest {
  position: string;
}

// 응답 데이터 타입 정의
export interface EditMemberPositionResponse {
  success: boolean;
  data: {
    id: number;
    user_id: number;
    position: string;
  };
  meta: null;
  error: string | null;
}

// 내 포지션 변경 API
export const editMemberPositionApi = async (
  teamId: number,
  data: EditMemberPositionRequest,
) => {
  const response = await api.patch(
    `/teams/${teamId}/members/me/position`,
    data,
  );
  return response.data;
};

// 활동 중인 맴버 목록 조회 api
export const getOnlineUsersApi = async (teamId: number): Promise<GetOnlineUsersResponse> => {
  const res = await api.get(`/teams/${teamId}/members/active`);
  return res.data;
};