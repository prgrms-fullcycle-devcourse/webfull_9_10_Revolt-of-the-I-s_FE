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
  imgUrl?: string;
  avatar?: string;
  email: string;
  phone: string;
  github: string;
}

// 프로필 이미지 추가한 유저 정보
export interface UserInfoResponse {
  id: number;
  uuid: string;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  github?: string;
  profile_image?: string;
  imageUrl?: string;
  avatar?: string;
}

// 서버에서 보내주는 유저 데이터의 원본 규격
export interface UserRawData {
  id?: number;
  uuid: string;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  github?: string;
  profileImage?: string;
}

// getMyInfoApi의 전체 응답 타입
export interface GetMyInfoResponse {
  success: boolean;
  data: {
    id: number;
    uuid: string;
    name: string;
    email: string;
    profileImage: string; // ✅ 이 부분이 있어야 합니다.
    phone?: string;
    position?: string;
    github?: string;
  } | null;
  meta: null;
  error: string | null;
}

// 활동 중인 유저 정보 : 서버 응답
export interface OnlineUserFromApi {
  id: number;
  position: string;
  status: string;
  user: {
    uuid: string;
    name: string;
    profile_image: string | null;
  };
}

// api 전체 응답 구조
export interface GetOnlineUsersResponse {
  success: boolean;
  data: OnlineUserFromApi[] | null;
  meta: null;
  error: string | null;
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
  requester_id: string;
  worker: string;
  worker_id: string;
  status: string;
  createdAt: string;
  comments: TaskComment[];
  is_edited: boolean;
}

// 공통 테스크 데이터
export interface TaskBaseFromApi {
  id: number;
  task_number: number;
  team_id: number;
  title: string;
  content: string;
  status: string;
  requester_id: string;
  requester_name: string;
  worker_id: string;
  worker_name: string;
  created_at: string;
  comment_count: number;
  is_edited: boolean;
}

// 테스크 상세 조회 응답 (comments와 상세 유저 정보 포함)
export interface TaskDetailFromApi extends TaskBaseFromApi {
  comments: TaskComment[];
}

// 테스크 댓글
export interface TaskComment {
  id: number;
  user: string;
  userImage?: string | null;
  text: string;
  time: string;
  is_edited: boolean;
}

// 활동 로그 히스토리 (Sidebar에 출력됨)
export interface Log {
  id: number | string;
  ticketId: number;
  user: string;
  action: string;
  time: string;
  type: 'default' | 'info' | 'success' | 'error';
}

// pusher 리스너 - 개인별 테스크 할당 알림 타입 정의
export interface NewTaskNotification {
  message: string;
  taskId: number;
  taskNumber: number;
  teamId: number;
}

// 서버에서 보내주는 댓글 원본 규격 (Mapping 전)
export interface TaskCommentFromApi {
  id: number;
  task_id: number;
  content: string;
  created_at: string;
  is_edited: boolean;
  user: {
    uuid: string;
    name: string;
    profile_image: string | null;
  };
}

// pusher 리스너 - 실시간 댓글 데이터 타입 정의
export interface PusherCommentData {
  id: number;
  task_id: number;
  content: string;
  created_at: string;
  is_edited: boolean;
  user: {
    uuid: string;
    name: string;
    profile_image: string | null;
  };
}

type ArchiveType = 'NOTE' | 'LINK' | 'PDF';

// 알림 타입 정의
export type NotificationType = "NEW_TASK" | "TASK_UPDATED" | "TASK_DELETED" | "STATUS_CHANGED" | "NEW_COMMENT";

// 알림 api 응답 타입 정의
export interface NotificationItem {
  id: number;
  user_id: string;
  team_id: number;
  teamName: string;
  task_id: number | null;
  type: NotificationType;
  message: string;
  is_read: boolean;
  created_at: string;
}

// Pusher로 넘어오는 데이터 규격
export interface PusherNotificationData {
  type: NotificationType;
  message: string;
  taskId: number;
  teamId: number;
  teamName: string;
}

// 팀 아카이브: 공유 링크, 문서, 회의록 공통 데이터
export interface TeamArchiveData {
  id: number;
  type: ArchiveType;
  title: string;
  content: string;
  created_at: string;
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
  memberCount?: number; // 로비용 멤버 수
  previewImages?: string[]; // 로비용 미리보기 이미지
  members: Member[];
  tickets: Ticket[];
  logs: Log[];
  notes: TeamArchiveData[];
  links: TeamArchiveData[];
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

// GET /teams 로비용 조회 응답 내 개별 팀원 정보
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

// GET /teams 로비용 조회 응답 내 개별 팀 정보
export interface TeamFromApi {
  id: number;
  name: string;
  owner_id?: string;
  isMember: boolean;
  memberCount?: number;
  previewImages?: string[];
  members?: TeamMemberFromApi[];
}

// GET /teams 로비용 조회 전체 응답 타입
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

// 구글 OAuth 요청 body 타입
export interface GoogleAuthRequest {
  googleToken: string;
}

// /auth/google 응답의 유저 타입
export interface GoogleAuthUser {
  email: string;
  google_uid: string;
  name: string;
}

// /auth/google 응답 타입
export interface GoogleAuthResponse {
  success: boolean;
  isNewUser: boolean;
  data: {
    user: GoogleAuthUser;
  } | null;
  meta: null;
  error: string | null;
}

// /auth/google/signup 요청 body 타입
export interface GoogleSignupRequest {
  email: string;
  googleUid: string;
  name: string;
  phone: string;
  profileImage?: File | null;
  github_url?: string;
}

// /auth/google/signup 응답 타입
export interface GoogleSignupResponse {
  success: boolean;
  data: {
    token: string;
    user: {
      uuid: string;
      email: string;
      name: string;
      phone: string;
      google_uid: string;
    };
  } | null;
  meta: null;
  error: string | null;
}
