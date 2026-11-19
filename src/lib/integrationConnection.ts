/**
 * Chaves que integrações OAuth gravam no config após o callback
 * (GA/Meta usam "email"; google-postmaster pode usar outra chave de conta
 * ou uma flag). A credencial em si nunca trafega — só metadados.
 */
const OAUTH_IDENTITY_KEYS = [
  "email",
  "google_email",
  "account_email",
  "connected_email",
  "email_address",
  // Cloudflare não expõe e-mail no callback; a conexão é marcada pelos
  // tokens/instante do consentimento gravados no config.
  "access_token",
  "refresh_token",
  "connected_at",
];

/**
 * Indica se uma integração OAuth já teve o consentimento concluído.
 * Aceita o objeto da integração (com `config`) ou um objeto que já contenha
 * o `config` da integração.
 */
export function isOAuthConnected(integration: any): boolean {
  const config = integration?.config;
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return false;
  }

  if (config.connected === true || config.authorized === true) {
    return true;
  }

  return OAUTH_IDENTITY_KEYS.some((key) => {
    const value = config[key];
    return typeof value === "string" && value.trim() !== "";
  });
}
