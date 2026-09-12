import { computed, watch, type Ref } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { isActionsColumn } from "@/components/custom/columnLabel";

const STORAGE_KEY = "betgpt:column-visibility";

type Visibility = Record<string, boolean>;
type TableMap = Record<string, Visibility>;
type PageMap = Record<string, TableMap>;
type Store = Record<string, PageMap>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // quota / private mode
  }
}

function resolveTableKey(table?: unknown): string {
  return typeof table === "string" && table.trim() ? table.trim() : "default";
}

export function loadColumnVisibility(
  userId: string,
  page: string,
  table: string,
): Visibility | null {
  const saved = readStore()[userId]?.[page]?.[table];
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return null;
  return saved;
}

export function saveColumnVisibility(
  userId: string,
  page: string,
  table: string,
  visibility: Visibility,
): void {
  const store = readStore();
  store[userId] ??= {};
  store[userId][page] ??= {};
  store[userId][page][table] = visibility;
  writeStore(store);
}

export function useColumnVisibilityStorage(
  columns: Ref<Array<{ id: string }>>,
  modelValue: Ref<Visibility>,
  emit: (value: Visibility) => void,
  table?: Ref<string | undefined>,
) {
  const route = useRoute();
  const authStore = useAuthStore();

  const userId = computed(() => {
    const user = authStore.user as { id?: number | string; email?: string } | null;
    if (user?.id != null) return String(user.id);
    if (user?.email) return user.email;
    return null;
  });

  const pageKey = computed(() => String(route.name || route.path || "unknown"));

  const tableKey = computed(() => resolveTableKey(table?.value));

  function lockedColumnIds(): Set<string> {
    return new Set(
      columns.value
        .filter((column) => isActionsColumn(column))
        .map((column) => column.id)
        .filter(Boolean),
    );
  }

  function restore() {
    if (!userId.value || columns.value.length === 0) return;

    const saved = loadColumnVisibility(userId.value, pageKey.value, tableKey.value);
    const lockedIds = lockedColumnIds();
    const next = { ...modelValue.value };
    let changed = false;

    if (saved) {
      const allowed = new Set(columns.value.map((column) => column.id));
      for (const [id, visible] of Object.entries(saved)) {
        if (!allowed.has(id) || typeof visible !== "boolean") continue;
        if (lockedIds.has(id)) continue;
        if (next[id] === visible) continue;
        next[id] = visible;
        changed = true;
      }
    }

    for (const id of lockedIds) {
      if (next[id] === true) continue;
      next[id] = true;
      changed = true;
    }

    if (changed) emit(next);
  }

  function persist(visibility: Visibility) {
    if (!userId.value || columns.value.length === 0) return;
    const allowed = new Set(columns.value.map((column) => column.id));
    const lockedIds = lockedColumnIds();
    const snapshot: Visibility = {};
    for (const [id, visible] of Object.entries(visibility)) {
      if (!allowed.has(id) || typeof visible !== "boolean") continue;
      snapshot[id] = lockedIds.has(id) ? true : visible;
    }
    for (const id of lockedIds) {
      snapshot[id] = true;
    }
    saveColumnVisibility(userId.value, pageKey.value, tableKey.value, snapshot);
  }

  watch([userId, pageKey, tableKey, () => columns.value.length], restore, {
    immediate: true,
  });

  return { persist, restore };
}
