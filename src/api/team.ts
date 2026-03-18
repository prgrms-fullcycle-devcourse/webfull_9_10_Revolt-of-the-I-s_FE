import type { Team, CurrentUser } from "../types";
import { INITIAL_TEAM } from "../utils/constants";

// 임시 팀 데이터 저장소
let mockTeams: Team[] = [INITIAL_TEAM];

// 팀 목록 조회용 임시 API
export const getTeamsApi = async (): Promise<Team[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockTeams);
    }, 300);
  });
};

// 팀 이름 중복 체크용 임시 API
export const checkTeamNameApi = async (teamName: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const exists = mockTeams.some(
        (team) => team.name.trim().toLowerCase() === teamName.trim().toLowerCase()
      );
      resolve(exists);
    }, 300);
  });
};

// 팀 생성용 임시 API
export const createTeamApi = async (
  teamName: string,
  teamPassword: string,
  currentUser: CurrentUser
): Promise<{ ok: boolean; message: string; team: Team | null }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const trimmedName = teamName.trim();
      const trimmedPassword = teamPassword.trim();

      // 팀 이름 길이 체크
      if (trimmedName.length < 2 || trimmedName.length > 30) {
        resolve({
          ok: false,
          message: "팀 이름은 2자 이상 30자 이하로 입력해주세요.",
          team: null,
        });
        return;
      }

      // 비밀번호 입력 체크
      if (!trimmedPassword) {
        resolve({
          ok: false,
          message: "비밀번호를 입력해주세요.",
          team: null,
        });
        return;
      }

      // 중복 팀 이름 체크
      const exists = mockTeams.some(
        (team) => team.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );

      if (exists) {
        resolve({
          ok: false,
          message: "이미 존재하는 팀 이름입니다.",
          team: null,
        });
        return;
      }

      const newTeam: Team = {
        id: `team_${Date.now()}`,
        name: trimmedName,
        password: trimmedPassword,
        members: [{ ...currentUser }],
        tickets: [],
        logs: [
          {
            id: Date.now(),
            ticketId: 0,
            user: currentUser.name,
            action: "새 프로젝트 개설",
            time: "현재",
            type: "info",
          },
        ],
        notes: [],
        links: [],
        userStatuses: {
          [currentUser.name]: { label: "활동 중", color: "bg-green-500" },
        },
      };

      mockTeams = [...mockTeams, newTeam];

      resolve({
        ok: true,
        message: "팀이 생성되었습니다.",
        team: newTeam,
      });
    }, 300);
  });
};

// 팀 가입용 임시 API
export const joinTeamApi = async (
  teamId: string,
  password: string,
  user: CurrentUser
): Promise<{ ok: boolean; message: string; team: Team | null }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let updatedTeam: Team | null = null;

      const targetTeam = mockTeams.find((team) => team.id === teamId);

      // 팀 존재 체크
      if (!targetTeam) {
        resolve({
          ok: false,
          message: "팀을 찾을 수 없습니다.",
          team: null,
        });
        return;
      }

      // 비밀번호 체크
      if (targetTeam.password !== password) {
        resolve({
          ok: false,
          message: "비밀번호가 틀렸습니다.",
          team: null,
        });
        return;
      }

      mockTeams = mockTeams.map((team) => {
        if (team.id !== teamId) return team;

        const alreadyJoined = team.members.some(
          (member) => member.name === user.name
        );

        if (alreadyJoined) {
          updatedTeam = team;
          return team;
        }

        const nextTeam: Team = {
          ...team,
          members: [...team.members, user],
          userStatuses: {
            ...team.userStatuses,
            [user.name]: { label: "방금 입장", color: "bg-green-500" },
          },
        };

        updatedTeam = nextTeam;
        return nextTeam;
      });

      resolve({
        ok: true,
        message: "팀 입장 완료",
        team: updatedTeam,
      });
    }, 300);
  });
};

// 팀 탈퇴용 임시 API
export const leaveTeamApi = async (
  teamId: string,
  userName: string
): Promise<{ ok: boolean; message: string; team: Team | null }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let updatedTeam: Team | null = null;

      const targetTeam = mockTeams.find((team) => team.id === teamId);

      // 팀 존재 체크
      if (!targetTeam) {
        resolve({
          ok: false,
          message: "팀을 찾을 수 없습니다.",
          team: null,
        });
        return;
      }

      mockTeams = mockTeams.map((team) => {
        if (team.id !== teamId) return team;

        const nextStatuses = { ...team.userStatuses };
        delete nextStatuses[userName];

        const nextTeam: Team = {
          ...team,
          members: team.members.filter((member) => member.name !== userName),
          userStatuses: nextStatuses,
        };

        updatedTeam = nextTeam;
        return nextTeam;
      });

      resolve({
        ok: true,
        message: "팀 탈퇴 완료",
        team: updatedTeam,
      });
    }, 300);
  });
};