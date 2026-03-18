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

// 팀 생성용 임시 API
export const createTeamApi = async (newTeam: Team): Promise<Team> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockTeams = [...mockTeams, newTeam];
      resolve(newTeam);
    }, 300);
  });
};

// 팀 가입용 임시 API
export const joinTeamApi = async (
  teamId: string,
  user: CurrentUser
): Promise<Team | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let updatedTeam: Team | null = null;

      mockTeams = mockTeams.map((team) => {
        if (team.id !== teamId) return team;

        const alreadyJoined = team.members.some(
          (member) => member.name === user.name
        );

        if (alreadyJoined) {
          updatedTeam = team;
          return team;
        }

        const nextTeam = {
          ...team,
          members: [...team.members, user],
        };

        updatedTeam = nextTeam;
        return nextTeam;
      });

      resolve(updatedTeam);
    }, 300);
  });
};

// 팀 탈퇴용 임시 API
export const leaveTeamApi = async (
  teamId: string,
  userName: string
): Promise<Team | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let updatedTeam: Team | null = null;

      mockTeams = mockTeams.map((team) => {
        if (team.id !== teamId) return team;

        const nextTeam = {
          ...team,
          members: team.members.filter((member) => member.name !== userName),
        };

        updatedTeam = nextTeam;
        return nextTeam;
      });

      resolve(updatedTeam);
    }, 300);
  });
};