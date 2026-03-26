import { Circle, PlayCircle, CheckCircle, CheckCircle2 } from 'lucide-react';
import type { StatusType, UserStatus, Team } from '../types';

// [UI 전용] 프로필 생성 시 랜덤으로 할당할 아바타 리스트
export const AVATARS = ['👩‍💻', '👨‍💻', '🎨', '⚙️', '🚀', '🧙‍♂️', '🕵️‍♀️', '🧑‍🚀'];

/**
 * [핵심 로직] 칸반 보드의 상태 흐름(Workflow) 정의
 * 💡 API 연결 시:
 * - 'id'값(todo, doing 등)은 백엔드 DB의 ticket_status 컬럼값과 정확히 일치해야합니다.
 * - 상태 추가/변경 시 이 객체만 수정하면 화면과 버튼 로직이 자동으로 업데이트됩니다.
 */
export const STATUS_TYPES: StatusType[] = [
  {
    id: 'Todo', // DB 저장 값
    label: 'Todo', // 화면 표시 이름
    icon: Circle,
    color: 'text-slate-400',
    border: 'border-slate-200',
    bg: 'bg-slate-50',
    next: 'Doing', // [수락하기] 클릭 시 이동할 상태
    nextLabel: '수락하기',
  },
  {
    id: 'Doing',
    label: 'Doing',
    icon: PlayCircle,
    color: 'text-blue-500',
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    next: 'Done', // [개발 완료] 클릭 시 이동할 상태
    nextLabel: '개발 완료',
  },
  {
    id: 'Done',
    label: 'Done',
    icon: CheckCircle,
    color: 'text-green-500',
    border: 'border-green-200',
    bg: 'bg-green-50',
    next: 'Checked', // [최종 확인] 클릭 시 이동할 상태
    nextLabel: '최종 확인',
    back: 'Doing', // [반려하기] 클릭 시 되돌아갈 상태
    backLabel: '반려하기',
  },
  {
    id: 'Checked',
    label: 'Checked',
    icon: CheckCircle2,
    color: 'text-purple-600',
    border: 'border-purple-200',
    bg: 'bg-purple-50',
    next: null, // 마지막 단계이므로 다음 단계 없음
    nextLabel: null,
  },
];

/**
 * [실시간 상태] 팀원들의 현재 활동 모드 리스트 (사이드바 하단용)
 * Pusher를 통해 실시간으로 주고받을 상태값의 기준이 됩니다.
 */
export const USER_ACTIVITIES: UserStatus[] = [
  { label: '개발 중', color: 'bg-green-500' },
  { label: '회의 중', color: 'bg-blue-500' },
  { label: '휴식 중', color: 'bg-orange-400' },
  { label: '자리 비움', color: 'bg-slate-300' },
];

/**
 * [테스트 데이터] 초기 진입 시 보여줄 샘플 팀 데이터
 *  API 연결 후에는 이 변수 대신 서버에서 fetch해온 데이터를 사용하게 됩니다.
 *  활용: 백엔드 서버가 점검 중이거나 로컬 개발 시 'Mock Data'로 유용하게 쓰입니다.
 */
export const INITIAL_TEAM: Team = {
  id: 'team_1',
  name: 'i들의 반란',
  password: '1234',
  members: [
    {
      name: '영아',
      position: 'Backend Lead',
      avatar: '👩‍💻',
      email: 'younga@istation.dev',
      github: 'https://github.com/younga',
    },
    {
      name: '민수',
      position: 'Frontend Dev',
      avatar: '👨‍💻',
      email: 'minsu@istation.dev',
      github: '',
    },
    {
      name: '지수',
      position: 'UI/UX Designer',
      avatar: '🎨',
      email: 'jisu@istation.dev',
      github: '',
    },
  ],
  tickets: [
    {
      id: 1, // DB의 PK와 매칭됨
      title: 'API 명세서 수정 요청',
      content:
        '로그인 시 반환되는 JWT 토큰에 유저 권한 정보 추가가 필요합니다.',
      requester: '영아',
      worker: '민수',
      status: 'Doing',
      createdAt: '2026.03.11 10:00',
      comments: [
        {
          id: 101,
          user: '민수',
          text: '네, 확인했습니다. 해당 정보는 payload에 담아드리면 될까요?',
          time: '2026.03.11 10:05',
        },
        {
          id: 102,
          user: '영아',
          text: '네, 맞습니다! 권한 코드(role) 형태로 부탁드려요.',
          time: '2026.03.11 10:10',
        },
        {
          id: 103,
          user: '민수',
          text: '알겠습니다. 오늘 오후 중으로 수정해서 배포해둘게요.',
          time: '2026.03.11 10:15',
        },
      ],
    },
    {
      id: 2,
      title: '메인 페이지 레이아웃 수정',
      content: '사이드바 너비를 240px에서 200px로 조정해 주세요.',
      requester: '민수',
      worker: '지수',
      status: 'Todo',
      createdAt: '2026.03.11 11:30',
      comments: [],
    },
  ],
  logs: [
    {
      id: 1,
      ticketId: 0,
      user: '영아',
      action: '팀 아지트 활성화',
      time: '03.11 09:00',
      type: 'default',
    },
  ],
  notes: [
    {
      id: 1,
      title: '주간 회의록 (03.11)',
      content: '### 결정 사항\n- MVP 기능 확정\n- 이번주 UI 완성',
      author: '영아',
      date: '2026.03.11',
    },
  ],
  links: [
    {
      id: 1,
      title: 'API 명세 링크',
      url: 'https://www.notion.so/i-Station-API-ver2-3263c7fd06d980709274d7582b66cf0b?source=copy_link',
      type: 'links',
    },
    {
      id: 2,
      title: '기획서 (Notion)입니다 반드시 확인해주세요',
      url: 'https://notion.so',
      type: 'documents',
    },
  ],

  /**
   * 멤버별 현재 상태 매핑 객체
   * { "이름": { 상태데이터 } } 구조
   */
  userStatuses: {
    영아: { label: '개발 중', color: 'bg-green-500' },
    민수: { label: '회의 중', color: 'bg-blue-500' },
    지수: { label: '자리 비움', color: 'bg-slate-300' },
  },
  isJoined: false,
};
