import { ref } from "vue";
import { extractFormErrors } from "@/lib/formErrors";

/**
 * Estado reativo de erros de validação (422) para diálogos de formulário.
 *
 * `handleError` retorna `true` quando o erro era um 422 tratável: os refs são
 * preenchidos e nenhum toast local deve ser exibido (o interceptor global já
 * mostra o resumo). Retornando `false`, o chamador mantém seu toast de
 * fallback para os demais erros.
 */
export function useFormErrors() {
  const fieldErrors = ref<Record<string, string>>({});
  const generalError = ref("");

  const handleError = (err: unknown): boolean => {
    const extracted = extractFormErrors(err);
    if (!extracted) return false;

    fieldErrors.value = extracted.fieldErrors;
    generalError.value = extracted.generalMessage;
    return true;
  };

  const clearErrors = () => {
    fieldErrors.value = {};
    generalError.value = "";
  };

  const errorFor = (field: string): string | undefined =>
    fieldErrors.value[field];

  return {
    fieldErrors,
    generalError,
    handleError,
    clearErrors,
    errorFor,
  };
}
