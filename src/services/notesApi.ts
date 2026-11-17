import axios from 'axios';

export interface Note { id: number; title: string; content: string | null; created_at: string }
export interface NotePayload { title: string; content: string }

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getNotes = async () => {
  const response = await apiClient.get<Note[]>('/notes');
  return response.data;
};

export const createNote = async (payload: NotePayload) => {
  const response = await apiClient.post<Note>('/notes', payload);
  return response.data;
};

export const updateNote = async (id: number, payload: NotePayload) => {
  const response = await apiClient.put<Note>(`/notes/${id}`, payload);
  return response.data;
};

export const deleteNote = async (id: number) => {
  await apiClient.delete(`/notes/${id}`);
};
