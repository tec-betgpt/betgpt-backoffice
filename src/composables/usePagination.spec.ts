import { describe, expect, it } from "vitest";
import { usePagination } from "@/composables/usePagination";

describe("usePagination", () => {
  it("inicia com os valores padrão", () => {
    const { pages } = usePagination();

    expect(pages.value).toEqual({ current: 1, total: 0, last: 0 });
  });

  it("aceita valores iniciais parciais", () => {
    const { pages } = usePagination({ last: 1 });

    expect(pages.value).toEqual({ current: 1, total: 0, last: 1 });
  });

  it("updateFromResponse sincroniza o estado com o payload da API", () => {
    const { pages, updateFromResponse } = usePagination();

    updateFromResponse({ current_page: 3, total: 42, last_page: 5 });

    expect(pages.value).toEqual({ current: 3, total: 42, last: 5 });
  });

  it("reset volta apenas a página atual para 1", () => {
    const { pages, reset, updateFromResponse } = usePagination();

    updateFromResponse({ current_page: 3, total: 42, last_page: 5 });
    reset();

    expect(pages.value).toEqual({ current: 1, total: 42, last: 5 });
  });
});
