import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { 
  getNotificationsApi, 
  getUnreadNotificationsApi, 
  readNotificationApi, 
  readAllNotificationsApi 
} from '../api/notifications';
import toast from 'react-hot-toast';
import { useEffect, useMemo } from 'react';
import { pusher } from '../utils/pusher';
import type { NotificationItem, PusherNotificationData } from '../types';

interface ExtendedNotificationItem extends NotificationItem {
  team_name?: string;
  team?: {
    name: string;
  };
}

export const useNotifications = (currentUserUuid: string | undefined) => {
  const queryClient = useQueryClient();

  // 읽지 않은 알림 조회
  const { data: unreadResponse } = useQuery({
    queryKey: ['notifications', 'unread', currentUserUuid],
    queryFn: getUnreadNotificationsApi,
    enabled: !!currentUserUuid,
  });

  // 전체 알림 조회
  const { data: allResponse } = useQuery({
    queryKey: ['notifications', 'all', currentUserUuid],
    queryFn: getNotificationsApi,
    enabled: !!currentUserUuid,
  });

  // Pusher 실시간 알림 리스너
  useEffect(() => {
    if (!currentUserUuid) return;

    const userChannel = pusher.subscribe(`user-${currentUserUuid}`);

    userChannel.bind('new-notification', (data: PusherNotificationData) => {
      const teamLabel = data.teamName ? `[${data.teamName}]` : '[알림]';
      const fullMessage = `${teamLabel} ${data.message}`;

      toast.success(fullMessage, {
        duration: 4000,
        icon: null, 
        style: {
          minWidth: '400px',
          padding: '16px 20px',
          background: '#1e293b',
          color: '#ffffff',
          borderRadius: '16px',
          fontSize: '13px',
          fontWeight: '600',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
        },
      });

      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    userChannel.bind('pusher:subscription_error', (status: unknown) => {
      console.error('Pusher 구독 에러:', status);
    });

    return () => {
      console.log(`🚫 Pusher 구독 해제: user-${currentUserUuid}`);
      userChannel.unbind_all();
      pusher.unsubscribe(`user-${currentUserUuid}`);
    };
  }, [currentUserUuid, queryClient]);

  // 데이터 가공
  const processedNotifications = useMemo((): (NotificationItem & { isNew: boolean })[] => {
  const allList: ExtendedNotificationItem[] = Array.isArray(allResponse?.data) 
    ? allResponse.data 
    : [];
    
  const unreadList: NotificationItem[] = unreadResponse?.data?.notifications || [];
  const unreadIds = new Set(unreadList.map(n => n.id));

  return allList.map(noti => {
    const teamNameValue = noti.teamName || noti.team_name || noti.team?.name || '알 수 없는 팀';

    return {
      ...noti,
      teamName: teamNameValue,
      isNew: unreadIds.has(noti.id) || !noti.is_read
    };
  });
}, [allResponse, unreadResponse]);

  const readMutation = useMutation({
    mutationFn: (id: number) => readNotificationApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const readAllMutation = useMutation({
    mutationFn: readAllNotificationsApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("모든 알림을 읽음 처리했습니다.", {
        duration: 3000,
        style: {
          minWidth: '350px',
          maxWidth: '500px',
          padding: '16px 24px',
          background: '#ffffff',
          color: '#1e293b',
          borderRadius: '16px',
          fontSize: '13px',
          fontWeight: '700',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
      });
    },
  });

  return {
    notifications: processedNotifications,
    unreadCount: unreadResponse?.data?.count || 0,
    readNotification: readMutation.mutate,
    readAllNotifications: readAllMutation.mutate,
  };
};