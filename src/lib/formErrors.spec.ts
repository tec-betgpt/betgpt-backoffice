import { describe, expect, it } from "vitest";
import { AxiosError, type AxiosResponse } from "axios";
import { extractFormErrors } from "@/lib/formErrors";

function axiosError(status: number | null, data?: unknown): AxiosError {
  const error = new AxiosError("Request failed", "ERR_BAD_REQUEST");

  if (status !== null) {
    error.response = {
      status,
      data,
      statusText: "",
      headers: {},
      config: { headers: {} },
    } as AxiosResponse;
  }

  return error;
}

describe("extractFormErrors", () => {
  it("extrai erros do envelope padronizado (errors, primeira mensagem por campo)", () => {
    const err = axiosError(422, {
      success: false,
      message: "Os dados informados são inválidos.",
      errors: {
        name: ["O nome é obrigatório.", "O nome já está em uso."],
        email: ["O e-mail é inválido."],
      },
    });

    expect(extractFormErrors(err)).toEqual({
      fieldErrors: {
        name: "O nome é obrigatório.",
        email: "O e-mail é inválido.",
      },
      generalMessage: "Os dados informados são inválidos.",
    });
  });

  it("extrai erros do envelope legado validatorResponse (data como mapa de campos)", () => {
    const err = axiosError(422, {
      success: false,
      message: "Falha de validação",
      data: {
        name: "O nome é obrigatório.",
        sector_id: ["Setor inválido."],
      },
    });

    expect(extractFormErrors(err)).toEqual({
      fieldErrors: { name: "O nome é obrigatório.", sector_id: "Setor inválido." },
      generalMessage: "Falha de validação",
    });
  });

  it("extrai erros do envelope padrão do Laravel (message + errors)", () => {
    const err = axiosError(422, {
      message: "The given data was invalid.",
      errors: { amount: ["The amount field is required."] },
    });

    expect(extractFormErrors(err)).toEqual({
      fieldErrors: { amount: "The amount field is required." },
      generalMessage: "The given data was invalid.",
    });
  });

  it("aceita valores string ou array de strings", () => {
    const err = axiosError(422, {
      message: "Inválido",
      errors: {
        name: "O nome é obrigatório.",
        email: ["O e-mail é inválido."],
      },
    });

    const result = extractFormErrors(err);
    expect(result?.fieldErrors).toEqual({
      name: "O nome é obrigatório.",
      email: "O e-mail é inválido.",
    });
  });

  it("prioriza `errors` sobre `data` quando ambos existem", () => {
    const err = axiosError(422, {
      success: false,
      message: "Inválido",
      errors: { name: ["Erro de errors."] },
      data: { name: "Erro de data." },
    });

    expect(extractFormErrors(err)?.fieldErrors).toEqual({
      name: "Erro de errors.",
    });
  });

  it("retorna null quando errors está vazio", () => {
    expect(axiosError(422, { success: false, message: "Inválido", errors: {} }))
      .toSatisfy((err) => extractFormErrors(err) === null);
  });

  it("retorna null quando errors contém apenas arrays vazios", () => {
    const err = axiosError(422, {
      message: "Inválido",
      errors: { name: [] },
    });

    expect(extractFormErrors(err)).toBeNull();
  });

  it("retorna null para status diferente de 422", () => {
    const err = axiosError(500, {
      success: false,
      message: "Erro interno",
      errors: { name: ["x"] },
    });

    expect(extractFormErrors(err)).toBeNull();
  });

  it("retorna null para erro sem response (rede)", () => {
    expect(extractFormErrors(axiosError(null))).toBeNull();
  });

  it("retorna null para erros que não são do axios", () => {
    expect(extractFormErrors(new Error("falha"))).toBeNull();
    expect(extractFormErrors("falha")).toBeNull();
    expect(extractFormErrors(null)).toBeNull();
  });

  it("usa mensagem genérica em pt-BR quando o 422 não traz message", () => {
    const err = axiosError(422, {
      success: false,
      errors: { name: ["O nome é obrigatório."] },
    });

    const result = extractFormErrors(err);
    expect(result?.generalMessage).toBe(
      "Verifique os campos destacados e tente novamente.",
    );
  });
});
