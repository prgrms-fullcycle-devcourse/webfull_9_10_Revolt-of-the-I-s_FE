import { api } from './client';

// 내 알림 전체 조회
export const getNotificationsApi = async () => {
  const response = await api.get('/notifications');
  return response.data;
};

// 읽지 않은 알림 조회
export const getUnreadNotificationsApi = async () => {
  const response = await api.get('/notifications/unread');
  return response.data;
};

// 전체 알림 읽음 처리
export const readNotificationApi = async (id: number) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

// 특정 알림 읽음 처리
export const readAllNotificationsApi = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};