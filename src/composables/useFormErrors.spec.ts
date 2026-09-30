import { describe, expect, it } from "vitest";
import { AxiosError, type AxiosResponse } from "axios";
import { useFormErrors } from "@/composables/useFormErrors";

function axios422(data: unknown): AxiosError {
  const error = new AxiosError("Request failed", "ERR_BAD_REQUEST");
  error.response = {
    status: 422,
    data,
    statusText: "",
    headers: {},
    config: { headers: {} },
  } as AxiosResponse;
  return error;
}

describe("useFormErrors", () => {
  it("handleError preenche os refs e retorna true em 422 com erros", () => {
    const { fieldErrors, generalError, handleError, errorFor } = useFormErrors();

    const handled = handleError(
      axios422({
        success: false,
        message: "Inválido",
        errors: { name: ["O nome é obrigatório."] },
      }),
    );

    expect(handled).toBe(true);
    expect(fieldErrors.value).toEqual({ name: "O nome é obrigatório." });
    expect(generalError.value).toBe("Inválido");
    expect(errorFor("name")).toBe("O nome é obrigatório.");
    expect(errorFor("email")).toBeUndefined();
  });

  it("handleError retorna false e não altera o estado em outros erros", () => {
    const { fieldErrors, generalError, handleError } = useFormErrors();

    expect(handleError(new Error("rede"))).toBe(false);
    expect(handleError(new AxiosError("sem response"))).toBe(false);
    expect(fieldErrors.value).toEqual({});
    expect(generalError.value).toBe("");
  });

  it("clearErrors limpa o estado", () => {
    const { fieldErrors, generalError, handleError, clearErrors } = useFormErrors();

    handleError(
      axios422({ message: "Inválido", errors: { name: ["obrigatório"] } }),
    );
    clearErrors();

    expect(fieldErrors.value).toEqual({});
    expect(generalError.value).toBe("");
  });
});
