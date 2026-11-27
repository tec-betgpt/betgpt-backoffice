export type UiVersion = "v1" | "v2";

const STORAGE_KEY = "elevate.ui_version";

// Na primeira fase a v2 é só para membros da Elevate.
export const V2_FOR_CLIENTS = false;

function read(): UiVersion {
  try {
    return localStorage.getItem(STORAGE_KEY) === "v2" ? "v2" : "v1";
  } catch {
    return "v1";
  }
}

// Lido uma vez no carregamento: as rotas da v2 são montadas antes do app subir.
export const uiVersion: UiVersion = read();
export const isV2 = uiVersion === "v2";

export function canUseV2(user: any): boolean {
  if (!user) return false;
  return user.access_type === "member" || V2_FOR_CLIENTS;
}

export function switchUiVersion(version: UiVersion, path = "/home") {
  try {
    if (version === "v2") localStorage.setItem(STORAGE_KEY, "v2");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    //
  }
  window.location.assign(path);
}
