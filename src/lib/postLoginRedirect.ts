const KEY = "post_login_redirect";

/** Guarda o destino para onde voltar após o login (ex.: link de convite). */
export function setPostLoginRedirect(path: string): void {
  sessionStorage.setItem(KEY, path);
}

/** Lê e limpa o destino guardado; retorna null se não houver. */
export function consumePostLoginRedirect(): string | null {
  const target = sessionStorage.getItem(KEY);

  if (target) {
    sessionStorage.removeItem(KEY);
  }

  return target;
}
