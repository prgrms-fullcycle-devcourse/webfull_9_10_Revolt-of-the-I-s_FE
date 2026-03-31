/**
 팀원 정보 관련 API 모음
 */

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
