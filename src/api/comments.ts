import { api } from "./client";

// 댓글 작성 api
export const createCommentApi = async (taskId: number, content: string) => {
  const response = await api.post(`/tasks/${taskId}/comments`, {
    content: content
  });
  return response.data;
};