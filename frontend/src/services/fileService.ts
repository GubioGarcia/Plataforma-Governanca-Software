import api from '../config/axios';

export interface ArquivoProjetoDTO {
  id: string;
  nomeOriginal: string;
  extensao: string;
  mimeType: string;
  tamanhoBytes: number;
  dataUpload: string;
  usuarioUpload: string;
}

export async function fetchFilesByProject(projectId: string): Promise<ArquivoProjetoDTO[]> {
  const response = await api.get<ArquivoProjetoDTO[]>(`/projects/${projectId}/files`);
  return response.data;
}

export async function uploadFile(projectId: string, file: File): Promise<ArquivoProjetoDTO> {
  const formData = new FormData();
  formData.append('file', file);

  // Content-Type deve ser undefined para que o Axios remova o default 'application/json'
  // e o browser gere automaticamente 'multipart/form-data; boundary=...'
  const response = await api.post<ArquivoProjetoDTO>(
    `/projects/${projectId}/files/upload`,
    formData,
    {
      headers: { 'Content-Type': undefined },
    },
  );
  return response.data;
}

export async function downloadFile(fileId: string, nomeOriginal: string): Promise<void> {
  // Download via axios para que o interceptor injete o token JWT no header
  const response = await api.get(`/files/${fileId}/download`, {
    responseType: 'blob',
  });

  const blob = new Blob([response.data], {
    type: response.headers['content-type'] ?? 'application/octet-stream',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeOriginal;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function deleteFile(fileId: string): Promise<void> {
  await api.delete(`/files/${fileId}`);
}

export default { fetchFilesByProject, uploadFile, downloadFile, deleteFile };
