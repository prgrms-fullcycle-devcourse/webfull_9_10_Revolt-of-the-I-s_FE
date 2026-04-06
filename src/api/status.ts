/**
 * [API] 실시간 통신 (Pusher/Socket) 설정
 * @description 티켓 생성, 상태 변경 등 실시간 이벤트 알림을 위한 소켓 클라이언트 설정입니다.
 */

import { api } from "./client";

export const updateMyStatusApi = async (teamId: number, status: string) => {
  try {
    const response = await api.patch(`/users/me/status`, {
      teamId: String(teamId),
      status: status 
    });
    
    return response.data;
  } catch (error) {
    console.error("상태 변경 API 실패:", error);
    throw error;
  }
};