/**
 팀원 정보 관련 API 모음
 */

import type { GetOnlineUsersResponse, GetTeamsResponse } from '../types';
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
export const getOnlineUsersApi = async (
  teamId: number,
): Promise<GetOnlineUsersResponse> => {
  const res = await api.get(`/teams/${teamId}/members/active`);
  return res.data;
};

// 프로필 이미지 변경 api
export const updateProfileImageApi = async (formData: FormData) => {
  const response = await api.patch('/users/profile/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// 팀원 조회 api
// 팀로비용 팀조회 api와 팀원 조회 api 분리 목적인 임시 api
export const getTeamMembersApi = async (
  teamId: number,
): Promise<GetTeamsResponse> => {
  const response = await api.get(`/teams/${teamId}/members`);
  return response.data;
};
