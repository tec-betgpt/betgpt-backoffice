<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Check, ChevronsUpDown, Clock3, Search, ShieldCheck } from "lucide-vue-next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ProjectAvatar from "@/components/custom/ProjectAvatar.vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { useShellStore } from "@/stores/shell";
import { areaOfRoute } from "@/navigation/registry";
import type { WorkspaceFilterItem } from "@/contracts/userProjectGroup";

const props = defineProps<{ isMember: boolean }>();
const emit = defineEmits<{ navigated: [] }>();

const route = useRoute();
const router = useRouter();
const workspace = useWorkspaceStore();
const shell = useShellStore();

const open = ref(false);
const search = ref("");
const searchInput = ref<HTMLInputElement | null>(null);

const inAdmin = computed(() => areaOfRoute(route.name as string) === "admin");
const current = computed(() => workspace.activeGroupProject);

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const matches = (item: WorkspaceFilterItem) =>
  !search.value || normalize(item.name ?? "").includes(normalize(search.value));

const recents = computed(() =>
  shell.recents
    .map((id) => workspace.group_projects.find((item) => item.id === id))
    .filter((item): item is WorkspaceFilterItem => Boolean(item) && matches(item!))
    .slice(0, 4),
);
const projects = computed(() => workspace.group_projects.filter((i) => i.type === "project" && matches(i)));
const groups = computed(() => workspace.group_projects.filter((i) => i.type === "group" && matches(i)));

watch(open, async (value) => {
  if (!value) return;
  search.value = "";
  await nextTick();
  searchInput.value?.focus();
});

const goTo = (item: WorkspaceFilterItem) => {
  open.value = false;
  emit("navigated");
  // Na mesma tela quando ela não depende de um registro específico do workspace anterior.
  const sameScreen =
    areaOfRoute(route.name as string) === "workspace" &&
    Object.keys(route.params).every((key) => key === "workspace");
  router.push(
    sameScreen
      ? { name: route.name as string, params: { workspace: item.id }, query: route.query }
      : { name: "workspace.home", params: { workspace: item.id } },
  );
};

const goToAdmin = () => {
  open.value = false;
  emit("navigated");
  router.push({ name: "admin.home" });
};

const firstResult = () => {
  const item = recents.value[0] ?? projects.value[0] ?? groups.value[0];
  if (item) goTo(item);
};
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <button
        type="button"
        class="flex w-full items-center gap-2.5 rounded-lg border border-sidebar-border bg-background/60 px-2.5 py-2 text-left text-sm transition-colors hover:bg-sidebar-accent"
      >
        <template v-if="inAdmin && props.isMember">
          <span class="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <ShieldCheck class="size-4" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate font-semibold">Admin Elevate</span>
            <span class="block truncate text-xs text-muted-foreground">Visão da Elevate</span>
          </span>
        </template>
        <template v-else>
          <ProjectAvatar
            class="size-8 shrink-0"
            shape="square"
            :name="current?.name ?? ''"
            :logo-url="current?.logo ?? null"
          />
          <span class="min-w-0 flex-1">
            <span class="block truncate font-semibold">{{ current?.name ?? "Escolha um workspace" }}</span>
            <span class="block truncate text-xs text-muted-foreground">
              {{ current?.type === "group" ? "Grupo de projetos" : "Projeto" }}
            </span>
          </span>
        </template>
        <ChevronsUpDown class="size-4 shrink-0 text-muted-foreground" />
      </button>
    </PopoverTrigger>

    <PopoverContent align="start" :side-offset="6" class="w-[19rem] p-0">
      <div class="flex items-center gap-2 border-b px-3">
        <Search class="size-4 shrink-0 text-muted-foreground" />
        <input
          ref="searchInput"
          v-model="search"
          type="text"
          placeholder="Buscar workspace..."
          class="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          @keydown.enter.prevent="firstResult"
        />
      </div>

      <div class="max-h-[22rem] overflow-y-auto p-1.5">
        <button
          v-if="props.isMember && !search"
          type="button"
          class="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
          @click="goToAdmin"
        >
          <span class="flex size-6 items-center justify-center rounded bg-primary text-primary-foreground">
            <ShieldCheck class="size-3.5" />
          </span>
          <span class="flex-1 text-left font-medium">Admin Elevate</span>
          <Check v-if="inAdmin" class="size-4" />
        </button>

        <template v-for="section in [
          { title: 'Recentes', items: search ? [] : recents, icon: true },
          { title: 'Projetos', items: projects, icon: false },
          { title: 'Grupos', items: groups, icon: false },
        ]" :key="section.title">
          <div v-if="section.items.length" class="mt-1">
            <p class="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {{ section.title }}
            </p>
            <button
              v-for="item in section.items"
              :key="`${section.title}-${item.id}`"
              type="button"
              class="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              @click="goTo(item)"
            >
              <ProjectAvatar class="size-6 shrink-0" shape="square" :name="item.name" :logo-url="item.logo" />
              <span class="min-w-0 flex-1 truncate text-left">{{ item.name }}</span>
              <Clock3 v-if="section.icon" class="size-3.5 text-muted-foreground" />
              <Check v-else-if="!inAdmin && current?.id === item.id" class="size-4" />
            </button>
          </div>
        </template>

        <p
          v-if="!projects.length && !groups.length"
          class="px-2 py-6 text-center text-sm text-muted-foreground"
        >
          Nenhum workspace encontrado.
        </p>
      </div>
    </PopoverContent>
  </Popover>
</template>
