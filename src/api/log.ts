import { api } from "./client";

export const getTeamLogsApi = async (teamId: number, isMine: boolean) => {
  const response = await api.get(`/tasks/${teamId}/logs`, {
    params: { my: isMine } 
  });
  return response.data;
};