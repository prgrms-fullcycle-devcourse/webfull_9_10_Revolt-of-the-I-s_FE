/**
 아카이브 관련 API 모음
 */

import { api } from './client';

// 퀵 링크 생성 요청 데이터 타입 정의
export interface CreateQuickLinkRequest {
  title: string;
  content: string;
}

// 퀵 링크 생성 응답 데이터 타입 정의
export interface CreateQuickLinkResponse {
  success: boolean;
  data: {
    id: number;
    team_id: number;
    type: string;
    title: string;
    content: string;
    created_at: string;
  };
  meta: null;
  error: string | null;
}

// 퀵 링크 목록 조회 api
export const getQuickLinksApi = async (teamId: number) => {
  const response = await api.get(`/teams/${teamId}/archives/links`);
  return response.data;
};

// 퀵 링크 생성 API 호출 함수
export const createQuickLinkApi = async (
  teamId: number,
  data: CreateQuickLinkRequest,
) => {
  const response = await api.post<CreateQuickLinkResponse>(
    `/teams/${teamId}/archives/links`,
    data,
  );
  return response.data;
};

// 퀵 링크 삭제 API 호출 함수
export const deleteQuickLinkApi = async (linkId: number) => {
  const response = await api.delete(`/archives/${linkId}/links`);
  return response.data;
};

// 문서 생성 요청 데이터 타입 정의
export interface CreateDocRequest {
  title: string;
  file: File | null;
}

export const createDocApi = async (teamId: number, data: CreateDocRequest) => {
  const formData = new FormData();
  formData.append('title', data.title);
  if (data.file) {
    formData.append('file', data.file);
  }

  const response = await api.post(
    `/teams/${teamId}/archives/documents`,
    formData,
    {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return response.data;
};

export const getDocApi = async (teamId: number) => {
  const response = await api.get(`/teams/${teamId}/archives/documents`);
  return response.data;
};

export const deleteDocApi = async (docId: number) => {
  const response = await api.delete(`/archives/${docId}/documents`);
  return response.data;
};

// 회의록 관련 api
export const getNotesApi = async (teamId: number) => {
  const response = await api.get(`/teams/${teamId}/archives/meeting`);
  return response.data;
};

export interface NoteRequest {
  title: string;
  content: string;
}

export const createNoteApi = async (teamId: number, data: NoteRequest) => {
  const response = await api.post(`/teams/${teamId}/archives/meeting`, {
    title: data.title,
    content: data.content,
  });
  return response.data;
};

export const getNoteDetailApi = async (archiveId: number) => {
  const response = await api.get(`/archives/${archiveId}/meeting`);
  return response.data;
};

export const editNoteApi = async (archiveId: number, data: NoteRequest) => {
  const response = await api.patch(`/archives/${archiveId}/meeting`, {
    title: data.title,
    content: data.content,
  });
  return response.data;
};

export const deleteNoteApi = async (archiveId: number) => {
  const response = await api.delete(`/archives/${archiveId}/meeting`);
  return response.data;
};
