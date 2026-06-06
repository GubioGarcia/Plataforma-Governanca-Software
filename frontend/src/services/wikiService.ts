import api from '../config/axios';
import type { WikiProjetoApi, WikiProjetoUpdateRequest } from '../types/wiki';

export async function fetchProjectWiki(projetoId: string): Promise<WikiProjetoApi> {
  const response = await api.get<WikiProjetoApi>(`/projeto/${projetoId}/wiki`);
  return response.data;
}

export async function fetchWikiById(wikiId: string): Promise<WikiProjetoApi> {
  const response = await api.get<WikiProjetoApi>(`/wiki/${wikiId}`);
  return response.data;
}

export async function saveProjectWiki(
  projetoId: string,
  data: WikiProjetoUpdateRequest,
): Promise<WikiProjetoApi> {
  const response = await api.put<WikiProjetoApi>(`/projeto/${projetoId}/wiki`, data);
  return response.data;
}

export default { fetchProjectWiki, fetchWikiById, saveProjectWiki };