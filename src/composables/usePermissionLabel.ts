import { useI18n } from "vue-i18n";

export function usePermissionLabel() {
  const { t, te } = useI18n();

  function permissionLabel(slug: string | null | undefined): string {
    if (slug == null || String(slug).trim() === "") {
      return "";
    }
    const key = String(slug);
    return te(key) ? String(t(key)) : key;
  }

  return { permissionLabel };
}
