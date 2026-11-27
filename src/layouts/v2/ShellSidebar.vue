<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useColorMode } from "@vueuse/core";
import { ChevronRight } from "lucide-vue-next";
import { cn } from "@/lib/utils";
import WorkspaceSwitcher from "@/layouts/v2/WorkspaceSwitcher.vue";
import AccountMenu from "@/layouts/v2/AccountMenu.vue";
import { useNavAccess } from "@/navigation/access";
import type { NavGroup, NavItem } from "@/navigation/registry";

const props = defineProps<{ groups: NavGroup[]; area: "admin" | "workspace" }>();
const emit = defineEmits<{ navigated: [] }>();

const route = useRoute();
const mode = useColorMode();
const { isMember, resolveTo } = useNavAccess();

const logo = computed(() =>
  mode.value === "dark" ? "/logo-elevate-white.png" : "/logo-elevate-black.png",
);

const isActive = (item: NavItem) => {
  const target = resolveTo(item);
  const name = route.name as string;
  return target?.name === name || Boolean(item.activeFor?.includes(name));
};

const openGroups = ref<Set<string>>(new Set());

const syncOpenGroup = () => {
  const active = props.groups.find((g) => g.label && g.items.some(isActive));
  if (active) openGroups.value = new Set([...openGroups.value, active.id]);
};

watch(() => [route.name, props.groups], syncOpenGroup, { immediate: true });

const toggle = (id: string) => {
  const next = new Set(openGroups.value);
  next.has(id) ? next.delete(id) : next.add(id);
  openGroups.value = next;
};

const itemClass = (item: NavItem) =>
  cn(
    "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
    isActive(item)
      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
  );
</script>

<template>
  <div class="flex h-full flex-col bg-sidebar text-sidebar-foreground">
    <div class="flex flex-col gap-3 px-3 pb-2 pt-4">
      <img :src="logo" alt="Elevate" class="h-4 w-auto self-start px-1" />
      <WorkspaceSwitcher :is-member="isMember" @navigated="emit('navigated')" />
    </div>

    <nav class="flex-1 overflow-y-auto px-3 py-2">
      <div v-for="group in props.groups" :key="group.id" class="mb-0.5 flex flex-col gap-0.5">
        <template v-if="!group.label">
          <router-link
            v-for="item in group.items"
            :key="item.id"
            :to="resolveTo(item)!"
            :class="itemClass(item)"
            @click="emit('navigated')"
          >
            <component :is="item.icon" class="size-4 shrink-0" />
            <span class="truncate">{{ item.label }}</span>
          </router-link>
        </template>

        <template v-else>
          <button
            type="button"
            :class="
              cn(
                'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                group.items.some(isActive) ? 'font-medium text-sidebar-foreground' : 'text-sidebar-foreground/80',
              )
            "
            @click="toggle(group.id)"
          >
            <component :is="group.icon" v-if="group.icon" class="size-4 shrink-0" />
            <span class="flex-1 truncate text-left">{{ group.label }}</span>
            <span
              v-if="group.internal"
              class="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400"
            >
              Só Elevate
            </span>
            <ChevronRight
              class="size-3.5 shrink-0 text-muted-foreground transition-transform"
              :class="openGroups.has(group.id) && 'rotate-90'"
            />
          </button>
          <div
            v-show="openGroups.has(group.id)"
            class="ml-[15px] flex flex-col gap-0.5 border-l border-sidebar-border pl-2"
          >
            <router-link
              v-for="item in group.items"
              :key="item.id"
              :to="resolveTo(item)!"
              :class="itemClass(item)"
              @click="emit('navigated')"
            >
              <component :is="item.icon" class="size-4 shrink-0" />
              <span class="truncate">{{ item.label }}</span>
            </router-link>
          </div>
        </template>
      </div>
    </nav>

    <div class="border-t border-sidebar-border p-2">
      <AccountMenu @navigated="emit('navigated')" />
    </div>
  </div>
</template>
