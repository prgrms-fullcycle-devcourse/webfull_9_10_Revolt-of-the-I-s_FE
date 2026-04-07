/**
 * URL 유효성 검사 함수
 * @description 도메인 형식, 공백, 프로토콜 오타, 특수문자 등을 체크합니다.
 */
export const validateUrl = (url: string): boolean => {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return false;

  // 1. 공백 체크
  if (/\s/.test(trimmedUrl)) return false;

  // 2. 프로토콜 체크 & 도메인 부분 추출
  let domainPart = trimmedUrl;
  const protocolRegex = /^(https?:\/\/)/;

  if (protocolRegex.test(trimmedUrl)) {
    domainPart = trimmedUrl.replace(protocolRegex, '');
    if (trimmedUrl.includes(':/') && !trimmedUrl.includes('://')) return false;
  } else {
    if (trimmedUrl.includes('://')) return false;
  }

  // 3. 점(.) 위치 및 최소 1개 이상 포함 여부
  if (domainPart.startsWith('.') || domainPart.endsWith('.')) return false;
  if (!domainPart.includes('.')) return false;

  // 4. 도메인 허용 문자 (영문, 숫자, 하이픈, 언더바, 점)
  const onlyDomain = domainPart.split('/')[0];
  const domainCharRegex = /^[a-zA-Z0-9\-_.]+$/;
  if (!domainCharRegex.test(onlyDomain)) return false;

  return true;
};
