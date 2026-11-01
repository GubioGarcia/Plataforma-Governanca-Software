/** Resposta 429 do nginx (limite de requisições por IP); o corpo é HTML, sem ProblemDetail. */
export const MENSAGEM_LIMITE_REQUISICOES =
  'Muitas tentativas em pouco tempo. Aguarde um minuto e tente novamente.';

export function isLimiteRequisicoes(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'response' in error
    && (error as { response?: { status?: number } }).response?.status === 429;
}

/**
 * Extrai a mensagem de erro de uma resposta da API (ProblemDetail RFC 7807)
 * ou de um erro genérico do Axios.
 */
export function extractApiErrorMessage(error: unknown, fallback = 'Falha ao salvar. Tente novamente.'): string {
  if (isLimiteRequisicoes(error)) return MENSAGEM_LIMITE_REQUISICOES;
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { detail?: string; title?: string } } }).response;
    if (response?.data?.detail) return response.data.detail;
    if (response?.data?.title) return response.data.title;
  }
  return fallback;
}
