import Pusher from 'pusher-js';

// Pusher 로그 디버깅 (개발 중에 연결 상태를 콘솔에서 보고 싶을 때 사용)
if (import.meta.env.DEV) {
  Pusher.logToConsole = true;
}

export const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
  cluster: import.meta.env.VITE_PUSHER_CLUSTER,
  forceTLS: true, // 보안 연결(HTTPS)
});