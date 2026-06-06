import api from '../config/axios';
import type { EventoProjeto } from '../types/event';

export interface CriarEventoRequest {
  nome: string;
  descricao?: string;
  projetoId: string;
  organizacaoId: string;
  dataHoraInicio: string;
  dataHoraFim?: string;
}

export interface AtualizarEventoRequest {
  nome: string;
  descricao?: string;
  dataHoraInicio: string;
  dataHoraFim?: string;
}

export async function fetchEventById(id: string): Promise<EventoProjeto> {
  const response = await api.get<EventoProjeto>(`/evento/${id}`);
  return response.data;
}

export async function fetchEventsByProject(projectId: string): Promise<EventoProjeto[]> {
  const response = await api.get<EventoProjeto[]>(`/evento/projeto/${projectId}`);
  return response.data;
}

export async function createEvent(data: CriarEventoRequest): Promise<EventoProjeto> {
  const response = await api.post<EventoProjeto>('/evento', data);
  return response.data;
}

export async function updateEvent(id: string, data: AtualizarEventoRequest): Promise<EventoProjeto> {
  const response = await api.put<EventoProjeto>(`/evento/${id}`, data);
  return response.data;
}

export async function deleteEvent(id: string): Promise<void> {
  await api.delete(`/evento/${id}`);
}

export default { fetchEventById, fetchEventsByProject, createEvent, updateEvent, deleteEvent };