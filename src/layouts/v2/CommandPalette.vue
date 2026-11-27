<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ShieldCheck } from "lucide-vue-next";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import ProjectAvatar from "@/components/custom/ProjectAvatar.vue";
import { useShellStore } from "@/stores/shell";
import { useWorkspaceStore } from "@/stores/workspace";
import { useNavAccess } from "@/navigation/access";
import { ADMIN_NAV, WORKSPACE_NAV, type NavItem } from "@/navigation/registry";

const router = useRouter();
const shell = useShellStore();
const workspace = useWorkspaceStore();
const { isMember, visibleGroups, resolveTo } = useNavAccess();

const sections = computed(() => {
  const list = [
    { id: "workspace", title: `No workspace ${workspace.activeGroupProject?.name ?? ""}`.trim(), groups: visibleGroups(WORKSPACE_NAV, "workspace") },
  ];
  if (isMember.value) list.unshift({ id: "admin", title: "Admin Elevate", groups: visibleGroups(ADMIN_NAV, "admin") });
  return list.map((s) => ({
    ...s,
    items: s.groups.flatMap((g) => g.items.map((item) => ({ item, group: g.label }))),
  }));
});

const go = (item: NavItem) => {
  const to = resolveTo(item);
  shell.paletteOpen = false;
  if (to) router.push(to);
};

const goWorkspace = (id: string) => {
  shell.paletteOpen = false;
  router.push({ name: "workspace.home", params: { workspace: id } });
};

const onKey = (event: KeyboardEvent) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    shell.paletteOpen = !shell.paletteOpen;
  }
};

onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
</script>

<template>
  <CommandDialog v-model:open="shell.paletteOpen">
    <CommandInput placeholder="Ir para uma tela ou workspace..." />
    <CommandList class="max-h-[60vh]">
      <CommandEmpty>Nada encontrado.</CommandEmpty>

      <CommandGroup v-for="section in sections" :key="section.id" :heading="section.title">
        <CommandItem
          v-for="{ item, group } in section.items"
          :key="`${section.id}-${item.id}`"
          :value="`${section.id} ${group ?? ''} ${item.label}`"
          class="gap-2"
          @select="go(item)"
        >
          <component :is="item.icon" class="size-4 text-muted-foreground" />
          <span>{{ item.label }}</span>
          <span v-if="group" class="ml-auto text-xs text-muted-foreground">{{ group }}</span>
        </CommandItem>
      </CommandGroup>

      <CommandGroup heading="Workspaces">
        <CommandItem
          v-if="isMember"
          value="workspace admin elevate"
          class="gap-2"
          @select="() => { shell.paletteOpen = false; router.push({ name: 'admin.home' }); }"
        >
          <ShieldCheck class="size-4 text-muted-foreground" />
          Admin Elevate
        </CommandItem>
        <CommandItem
          v-for="item in workspace.group_projects"
          :key="item.id"
          :value="`workspace ${item.name}`"
          class="gap-2"
          @select="goWorkspace(item.id)"
        >
          <ProjectAvatar class="size-5" shape="square" :name="item.name" :logo-url="item.logo" />
          {{ item.name }}
          <span class="ml-auto text-xs text-muted-foreground">{{ item.type === "group" ? "Grupo" : "Projeto" }}</span>
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </CommandDialog>
</template>
