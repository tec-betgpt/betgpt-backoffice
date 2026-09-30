import { ref } from "vue";

export interface PaginationState {
  current: number;
  total: number;
  last: number;
}

export interface PaginatedResponse {
  current_page: number;
  total: number;
  last_page: number;
}

/**
 * Estado reativo de paginação para listagens que consomem respostas
 * paginadas (`current_page`/`total`/`last_page`).
 *
 * `updateFromResponse` sincroniza o estado a partir do payload da API e
 * `reset` volta para a primeira página (usado ao trocar filtros/workspace).
 */
export function usePagination(initial: Partial<PaginationState> = {}) {
  const pages = ref<PaginationState>({
    current: 1,
    total: 0,
    last: 0,
    ...initial,
  });

  const reset = () => {
    pages.value.current = 1;
  };

  const updateFromResponse = (data: PaginatedResponse) => {
    pages.value = {
      current: data.current_page,
      total: data.total,
      last: data.last_page,
    };
  };

  return {
    pages,
    reset,
    updateFromResponse,
  };
}
