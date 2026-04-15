# 🛠️ i-station — Frontend

> **팀 협업 도구 서비스** | React + TypeScript + Vite (Vercel)

[![Vercel](https://img.shields.io/badge/Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://webfull-9-10-revolt-of-the-i-s-fe-e.vercel.app/)
[![Backend Repo](https://img.shields.io/badge/Backend_Repo-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/prgrms-fullcycle-devcourse/webfull_9_10_Revolt-of-the-I-s_BE)

</br>

## 📌 서비스 소개

> "묻지 말고 확인하자, 묻히지 않게 기록하자!"

**i-Station**은 소규모 개발팀을 위한 **협업 신뢰 시스템**입니다.

슬랙 메시지는 읽고 지나치기 쉽고, Jira는 너무 복잡합니다.

- PIN 번호 하나로 팀에 즉시 합류
- 칸반 보드로 태스크를 직관적으로 관리
- 실시간 알림으로 팀원의 변경사항 즉시 확인
- 회의록 · 퀵링크 · PDF를 한 곳에서 관리

</br>

## 💡 기획 배경

소규모 개발팀에서 흔히 발생하는 **3가지 노이즈**를 해결합니다.

| 문제                 | 설명                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| 요청 전달의 불확실성 | 슬랙 메시지는 읽고 지나치기 쉬워 담당자 도달 여부 확인 불가           |
| 진행 상황의 불투명성 | 담당자가 확인했는지, 현재 작업 중인지 알 수 없어 반복적인 재확인 발생 |
| 소통의 피로도        | "지금 계세요?", "언제 완료되나요?" 등 불필요한 질의로 인한 몰입 깨짐  |

</br>

## 🎯 목표

- **Ticket-Based Workflow** : 모든 요청을 카드화하여 누락 없는 업무 관리
- **Live Status** : 팀원 상태 배지로 불필요한 핑(Ping) 없이 소통 타이밍 자율 조절
- **History Log** : 업무 이력을 데이터로 남겨 개인 기여도 증명 및 팀 회고 활용
</br>

## 🏗️ 기술 스택
| 구분           | 기술                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Fremework        | <img width="86" height="28" alt="image" src="https://img.shields.io/badge/REACT-61DAFB?style=for-the-badge&logo=react&logoColor=white" /> |
| Build Tool      | <img width="89" height="28" alt="image" src="https://img.shields.io/badge/VITE_7-646CFF?style=for-the-badge&logo=vite&logoColor=white" /> |
| Language       | <img src="https://img.shields.io/badge/TYPESCRIPT-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/> |
| StateManagement | <nobr><img src="https://img.shields.io/badge/TANSTACK_QUERY-FF4154?style=for-the-badge&logo=reactquery&logoColor=white"/> <img src="https://img.shields.io/badge/REACT_CONTEXT_API-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"/></nobr> |
| HTTP Client | <img width="86" height="28" alt="image" src="https://img.shields.io/badge/AXIOS-5A29E4?style=for-the-badge&logo=axios&logoColor=white" /> |
|  Real-time | <img width="116" height="28" alt="image" src="https://img.shields.io/badge/PUSHER_JS-300D4F?style=for-the-badge&logo=pusher&logoColor=white" /> |
|  Routing | <img width="201" height="28" alt="image" src="https://img.shields.io/badge/REACT_ROUTER_DOM_V7-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white" /> |
|  Styling | <img width="139" height="28" alt="image" src="https://img.shields.io/badge/TAILWINDCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" /> |
| Library | <nobr><img alt="Lucide React" src="https://img.shields.io/badge/LUCIDE_REACT-111111?style=for-the-badge" /> <img alt="React Hot Toast" src="https://img.shields.io/badge/REACT_HOT_TOAST-FF7849?style=for-the-badge" /> <img alt="React Markdown" src="https://img.shields.io/badge/REACT_MARKDOWN-000000?style=for-the-badge&logo=markdown&logoColor=white" /> <img alt="Remark GFM" src="https://img.shields.io/badge/REMARK_GFM-222222?style=for-the-badge" /></nobr> |
| Infrastructure & Tools | <nobr><img alt="Vercel" src="https://img.shields.io/badge/VERCEL-000000?style=for-the-badge&logo=vercel&logoColor=white" /> <img alt="PNPM" src="https://img.shields.io/badge/PNPM-F69220?style=for-the-badge&logo=pnpm&logoColor=white" /></nobr> |                                                                      
</br>

## 👨‍💻 팀원 역할

### 👨‍💻 Backend

| 프로필 | 이름 | 담당 기능 |
| :---: | :---: | :--- |
| <img src="https://github.com/user-attachments/assets/e4a07a88-da98-4687-8a93-6a95923d0160" width="100" height="100"> | **장건영** | • **auth**: 회원가입, 로그인, 로그아웃, 구글 OAuth <br> • **user**: 로그인 유저 조회, 내 상태 업데이트 |
| <img src="https://github.com/user-attachments/assets/e339ee49-85e7-40f4-9fcc-6766cc62b07f" width="100" height="100"> | **강영아** | • **log**: 팀 활동 로그 조회, 개인 활동 로그 조회 <br> • **task**: 목록 조회, 생성, 수정, 삭제, 상세 조회, 상태 변경(수락/제출/승인/반려) <br> • **Comment**: 작성, 수정, 삭제 <br> • **notification**: 알림 전체 조회, 읽지 않은 알림 조회, 읽음 처리, 전체 읽음 처리 <br> • **DB**: 마이그레이션 (Render → Neon) |
| <img src="https://github.com/user-attachments/assets/1a37049d-aec2-4a43-ae6d-452fbef42095" width="100" height="100"> | **김가영** | • **team**: 팀 목록 조회, 팀 생성, 팀 탈퇴, 팀 가입, 포지션 수정, 활동 중인 팀원 목록, 팀 멤버 목록 조회 <br> • **archive**: 회의록 작성/수정/삭제/목록/상세, 퀵링크 생성/조회/삭제, 문서 등록/조회/삭제 |                                                                           |

### 👨‍💻 Frontend

| 프로필 | 이름 | 담당 기능 |
| :---: | :---: | :--- |
| <img src="https://github.com/user-attachments/assets/a384dbb4-9edf-4271-ba47-462aeaa546b0" width="100" height="100"> | **송정화** | • **team**: 활동 중인 팀원 목록 <br> • **user**: 로그인 유저 조회, 내 상태 업데이트 <br> • **log**: 팀 활동 로그 조회, 개인 활동 로그 조회 <br> • **task**: 목록 조회, 생성, 수정, 삭제, 상세 조회, 상태 변경(수락/제출/승인/반려) <br> • **Comment**: 작성, 수정, 삭제 <br> • **notification**: 알림 전체 조회, 읽지 않은 알림 조회, 읽음 처리, 전체 읽음 처리 <br> • **devOps**: 배포 자동화 (Vercel) |
| <img src="https://github.com/user-attachments/assets/89828645-8c13-4a40-b6af-3c6b9c231542" width="100" height="100"> | **허송희** | • **team**: 팀 멤버 목록 조회, 포지션 수정 <br> • **archive**: 회의록 작성/수정/삭제/목록/상세, 퀵링크 생성/조회/삭제, 문서 등록/조회/삭제|
| <img src="https://github.com/user-attachments/assets/6da68607-943c-4c7d-8581-c96334ea1d3d" width="100" height="100"> | **김병성** | • **auth**: 회원가입, 로그인, 로그아웃, 구글 OAuth <br> • **team**: 팀 목록 조회, 팀 생성, 팀 탈퇴, 팀 가입 |

</br>

## 📁 프로젝트 구조

```
src/
├── api/           # 인증, 팀, 테스크, 아카이브 등 API 요청 관리
├── components/    # 공통 UI 및 재사용 컴포넌트 관리
│   ├── layout/    # 레이아웃 관련 컴포넌트
│   ├── status/    # 상태 표시 관련 컴포넌트
│   ├── task/      # 칸반보드 및 테스크 관련 컴포넌트
│   └── ui/        # 모달, 카드 등 공통 UI 컴포넌트
├── hooks/         # 팀, 알림 등 상태 로직을 분리한 커스텀 훅 관리
├── pages/         # 로그인, 회원가입, 로비, 대시보드 등 페이지 컴포넌트 관리
├── types/         # 전역 TypeScript 타입 정의
├── utils/         # 상수, 포맷 함수, 유효성 검사, Pusher 설정 등 공통 유틸 관리
├── App.tsx/       # 전체 앱 구조 및 화면 흐름 연결
├── google.d.ts/   # Google OAuth 타입 선언
└── main.tsx/      # 앱 진입점

````
</br>

## 🔑 핵심 기능

### ✍️ 로그인 / 회원가입
- 회원가입
    - 일반 회원가입: 사용자가 정보를 직접 입력하여 가입
- 프로필 이미지 업로드 및 기본 이미지 적용
<img width="3420" height="1970" alt="image" src="https://github.com/user-attachments/assets/c76a5628-fcab-47cc-ae6c-3e6d5aa2224f" />


- 로그인
    - 일반 로그인 / 구글 OAuth 로그인 지원
<img width="3420" height="1584" alt="image" src="https://github.com/user-attachments/assets/5573b148-fb68-489d-91d2-23bacee1617a" />


- 구글 OAuth 회원가입
    - 구글 계정 인증 후 추가 정보 입력으로 가입
<img width="3420" height="1970" alt="image" src="https://github.com/user-attachments/assets/7a45e952-4aad-4d18-b5a9-1d28360eeafd" />



### 🏢 팀 로비
- 팀 목록 조회
- 팀 검색
- 탈퇴
- 로그아웃
<img width="1059" height="681" alt="image" src="https://github.com/user-attachments/assets/853d6adb-9d20-44eb-bdeb-0a3411e569cc" />

- 팀 생성
- 보안 인증(PIN) 기반 팀 입장
<img width="982" height="725" alt="image" src="https://github.com/user-attachments/assets/d1cd1a06-8bb3-42e2-ac07-3b808b3fd0a0" />

- 팀 입장
<img width="1452" height="912" alt="image" src="https://github.com/user-attachments/assets/e5f47712-0219-4963-ad2e-877871c7d9b4" />

### ✅ 칸반 보드
- 태스크 생성·수정·삭제
- 상태 전이: `Todo → Doing → Done → Checked`
- 댓글 기능
- 요청자 / 담당자 버튼 권한 부여
<img width="3420" height="1902" alt="image" src="https://github.com/user-attachments/assets/550bb776-3874-4316-bce7-a752ab4f21d6" />
<img width="3420" height="1902" alt="image" src="https://github.com/user-attachments/assets/c5b7d1f3-ea38-4e6c-b0c1-38f00937c900" />


### 📢 알림 및 로그
- Pusher 기반 실시간 처리
- 읽음 처리 (단건 / 전체)
- 로그/내소식
<img width="3420" height="1902" alt="image" src="https://github.com/user-attachments/assets/0dc3aad4-0cab-4417-85f3-6ce0dc29343c" />


### 🏝️ 내 상태 관리
- 내 프로필 이미지 변경
- 내 상태 변경
- 팀 탈퇴
- 로그아웃
<img width="3420" height="1902" alt="image" src="https://github.com/user-attachments/assets/4189c974-0840-4d85-af3c-7de628290fe2" />


### 👥 팀원 정보

#### 입장한 팀의 팀원 정보 표시
- 내 정보를 첫 순서로 고정
- 옵션 정보(깃허브) 없을 시 분기 처리
<img width="2495" height="1850" alt="image" src="https://github.com/user-attachments/assets/47a14d40-0447-481c-ad42-b0594d9e207e" />

#### 내 포지션명 관리
- 포지션명 추가 및 수정
<img width="2496" height="1850" alt="image" src="https://github.com/user-attachments/assets/cd46d7e9-29e3-4e89-af1d-ee16cf91ca9a" />

### 🗄️ 아카이브
<img width="2493" height="1841" alt="image" src="https://github.com/user-attachments/assets/69920d52-80e8-41be-9a97-4e7f5727ef95" />

#### 회의록 관리
- 데이터가 없는 경우 빈화면 제공
- 회의록 작성/상세조회/수정/삭제
<img width="2482" height="1839" alt="image" src="https://github.com/user-attachments/assets/a9023619-3c46-4fc9-9fd0-441e49bac58a" />
<img width="2483" height="1835" alt="image" src="https://github.com/user-attachments/assets/ced44a82-a756-4d0f-ac90-63f25bc9149f" />

#### 회의록 상세
- 마크다운 렌더링 적용
<img width="2484" height="1833" alt="image" src="https://github.com/user-attachments/assets/b484e8ca-d588-4d73-a495-bcad3b675135" />

#### 퀵링크, PDF파일 관리
- 파일이 모두 없는 경우 빈화면 제공
- 퀵링크 등록, 삭제
- PDF파일 등록, 삭제
    - 파일 첨부 기능

<img width="2488" height="1832" alt="image" src="https://github.com/user-attachments/assets/b6e1f12f-5fc6-4196-acf0-ca9f6e67f7d2" />
<img width="2496" height="1840" alt="image" src="https://github.com/user-attachments/assets/7058b999-ccfb-4848-a645-3685737c3a35" />
<img width="2492" height="1844" alt="image" src="https://github.com/user-attachments/assets/cefe4057-8c19-4121-a035-9c2f57d7c0eb" />
<img width="2486" height="1823" alt="image" src="https://github.com/user-attachments/assets/10dae549-dc70-48e5-a201-8eedf5565d4b" />


## 🚀 실행 방법

```bash
# 패키지 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 프로덕션 빌드
pnpm run build
```