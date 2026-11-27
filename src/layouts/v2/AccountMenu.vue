<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useColorMode } from "@vueuse/core";
import { ChevronsUpDown, LogOut, Monitor, Moon, Palette, Sun, Undo2 } from "lucide-vue-next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth";
import { ACCOUNT_NAV } from "@/navigation/registry";
import { switchUiVersion } from "@/navigation/uiVersion";

const emit = defineEmits<{ navigated: [] }>();

const router = useRouter();
const auth = useAuthStore();
const mode = useColorMode();
const theme = ref(localStorage.getItem("theme") || "auto");

watch(theme, (value) => {
  localStorage.setItem("theme", value);
  mode.value = value as typeof mode.value;
});

const user = computed<any>(() => auth.user);
const displayName = computed(() => {
  const u = user.value;
  if (!u) return "";
  return u.name || [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email;
});
const initials = computed(() =>
  displayName.value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join(""),
);

const open = (name: string) => {
  emit("navigated");
  router.push({ name });
};

const backToCurrentVersion = () => switchUiVersion("v1", window.location.pathname);

const logout = async () => {
  await auth.logout();
  router.push("/login");
};
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        class="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-sidebar-accent"
      >
        <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {{ initials || "?" }}
        </span>
        <span class="min-w-0 flex-1">
          <span class="block truncate font-medium">{{ displayName }}</span>
          <span class="block truncate text-xs text-muted-foreground">{{ user?.email }}</span>
        </span>
        <ChevronsUpDown class="size-4 shrink-0 text-muted-foreground" />
      </button>
    </DropdownMenuTrigger>

    <DropdownMenuContent side="top" align="start" class="w-64">
      <DropdownMenuLabel class="font-normal">
        <p class="truncate text-sm font-medium">{{ displayName }}</p>
        <p class="truncate text-xs text-muted-foreground">{{ user?.email }}</p>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />

      <DropdownMenuItem
        v-for="item in ACCOUNT_NAV"
        :key="item.id"
        class="gap-2"
        @select="open((item.to as any).name)"
      >
        <component :is="item.icon" class="size-4" />
        {{ item.label }}
      </DropdownMenuItem>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger class="gap-2">
          <Palette class="size-4" />
          Tema
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup v-model="theme">
            <DropdownMenuRadioItem value="auto" class="gap-2"><Monitor class="size-4" /> Sistema</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="light" class="gap-2"><Sun class="size-4" /> Claro</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark" class="gap-2"><Moon class="size-4" /> Escuro</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSeparator />
      <DropdownMenuItem class="gap-2" @select="backToCurrentVersion">
        <Undo2 class="size-4" />
        Voltar para a versão atual
      </DropdownMenuItem>
      <DropdownMenuItem class="gap-2 text-destructive focus:text-destructive" @select="logout">
        <LogOut class="size-4" />
        Sair
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
