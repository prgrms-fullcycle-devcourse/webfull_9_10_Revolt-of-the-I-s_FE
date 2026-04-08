import { api } from "./client";

// 댓글 작성 api
export const createCommentApi = async (taskId: number, content: string) => {
  const response = await api.post(`/tasks/${taskId}/comments`, {
    content: content
  });
  return response.data;
};

// 댓글 수정 api
export const updateCommentApi = async (commentId: number, content: string) => {
  const response = await api.patch(`/tasks/comments/${commentId}`, {
    content: content
  });
  return response.data;
};

// 댓글 삭제 api
export const DeleteCommentApi = async (commentId: number) => {
  const response = await api.delete(`/tasks/comments/${commentId}`, {
  });
  return response.data;
};