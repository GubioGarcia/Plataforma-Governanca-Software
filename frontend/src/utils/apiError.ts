/**
 * Extrai a mensagem de erro de uma resposta da API (ProblemDetail RFC 7807)
 * ou de um erro genérico do Axios.
 */
export function extractApiErrorMessage(error: unknown, fallback = 'Falha ao salvar. Tente novamente.'): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { detail?: string; title?: string } } }).response;
    if (response?.data?.detail) return response.data.detail;
    if (response?.data?.title) return response.data.title;
  }
  return fallback;
}
