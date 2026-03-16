/**
 * 현재 시간을 'MM.DD HH:mm' 형식의 문자열로 반환합니다.
 */
export function formatLogTime(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  
  return `${m}.${d} ${h}:${min}`;
}