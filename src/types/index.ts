import { Circle } from 'lucide-react';

// 유저의 활동 상태 (예: '개발 중', 'bg-green-500')
export interface UserStatus {
  label: string;
  color: string;
}

// 개별 팀원 정보 (로그인 시 입력받는 데이터 규격)
export interface Member {
  id?: number;
  uuid: string;
  name: string;
  position: string;
  avatar?: string;
  email: string;
  phone: string;
  github: string;
}

// 티켓 내부 댓글 구조
export interface Comment {
  id: number;
  user: string;
  text: string;
  time: string;
}

// 업무 티켓(Task) 정보
export interface Ticket {
  id: number;
  task_number: number;
  title: string;
  content: string;
  requester: string;
  worker: string;
  status: string;
  createdAt: string;
  comments: Comment[];
}

// 활동 로그 히스토리 (Sidebar에 출력됨)
export interface Log {
  id: number;
  ticketId: number;
  user: string;
  action: string;
  time: string;
  type: 'default' | 'info' | 'success' | 'error';
}

// 팀 아카이브: 회의록 데이터
export interface Note {
  id: number;
  title: string;
  content: string;
  author: string;
  date: string;
}

// 팀 아카이브: 공유 링크 데이터
export interface TeamLink {
  id: number;
  type: string;
  title: string;
  content: string;
  createdAt: string;
}

/**
 * 8. 팀(Project) 최상위 객체
 * @description 서비스의 가장 큰 단위로, 해당 프로젝트에 귀속된 모든 데이터를 포함합니다.
 */
export interface Team {
  id: string;
  name: string;
  password: string;
  isMember?: boolean;
  members: Member[];
  tickets: Ticket[];
  logs: Log[];
  notes: Note[];
  links: TeamLink[];
  userStatuses: Record<string, UserStatus>;
}

export type CurrentUser = Member;

/**
 * 9. 칸반 상태 설정 타입
 * @description 'Todo' 등 각 컬럼의 아이콘, 색상 및 상태 전환 흐름을 정의합니다.
 */
export interface StatusType {
  id: string;
  label: string;
  icon: typeof Circle; // Lucide 아이콘 컴포넌트 타입
  color: string; // 아이콘 및 텍스트 색상 (Tailwind)
  border: string; // 컬럼/카드 테두리 색상
  bg: string; // 배경색
  next: string | null; // 다음 단계 상태 ID
  nextLabel: string | null; // 다음 단계 버튼 문구
  back?: string; // 이전 단계 상태 ID (반려용)
  backLabel?: string; // 이전 단계 버튼 문구
}

// GET /teams API 응답 내 개별 팀원 정보
export interface TeamMemberFromApi {
  id: number;
  position: string;
  status: string;
  user: {
    uuid: string;
    email: string;
    name: string;
    phone: string;
    github_url: string;
    profile_image: string | null;
  };
}

// GET /teams API 응답 내 개별 팀 정보
export interface TeamFromApi {
  id: number;
  name: string;
  owner_id: string;
  isMember: boolean;
  members: TeamMemberFromApi[];
}

// GET /teams API 전체 응답 타입
export interface GetTeamsResponse {
  success: boolean;
  data: TeamFromApi[] | null;
  meta: null;
  error: string | null;
}

// POST /teams 요청 body 타입
export interface CreateTeamRequest {
  name: string;
  pin_password: string;
}

// POST /teams 응답 타입
export interface CreateTeamResponse {
  success: boolean;
  data: {
    id: number;
    name: string;
    owner_id: string;
  } | null;
  meta: null;
  error: string | null;
}

// POST /teams/{teamId}/members 요청 body 타입
export interface JoinTeamRequest {
  password: string;
  userId: number;
}

// POST /teams/{teamId}/members 응답 타입
export interface JoinTeamResponse {
  success: boolean;
  data: {
    message: string;
  } | null;
  meta: null;
  error: string | null;
}

// DELETE /teams/{teamId}/members/me 응답 타입
export interface LeaveTeamResponse {
  success: boolean;
  data: {
    message: string;
  } | null;
  meta: null;
  error: string | null;
}
