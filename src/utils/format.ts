/**
 * 현재 시간을 'MM.DD HH:mm' 형식의 문자열로 반환합니다.
 */
export const formatLogTime = (): string => {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');

  return `${m}.${d} ${h}:${min}`;
};

// 도메인 추출 함수
export const getHostname = (url: string) => {
  try {
    if (!url || !url.startsWith('http')) return url;
    return new URL(url).hostname;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log('URL에서 호스트네임 추출 실패 :', error.message);
    } else {
      console.log('알 수 없는 에러 발생 :', error);
    }
    return url;
  }
};
