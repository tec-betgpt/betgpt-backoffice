<script setup lang="ts">
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter, RouterView } from "vue-router";
import { useWorkspaceStore } from "@/stores/workspace";

const workspaceStore = useWorkspaceStore();
const activeGroupProject = workspaceStore.activeGroupProject;

const sidebarNavItems: {title: string, route: string, show: boolean}[] = [
  {
    title: "Perfil",
    route: "configurations.profile",
    show: true,
  },
  {
    title: "Segurança",
    route: "configurations.security",
    show: true,
  },
  {
    title: "Notificações",
    route: "configurations.notifications",
    show: true,
  },


];

const router = useRouter();
</script>

<template>
  <div class="h-fit w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Configurações</h2>
      <p class="text-muted-foreground">
        Gerencie as configurações das suas contas e preferências de e-mail.
      </p>
    </div>
    <Separator class="my-6" />
    <div
      class=" w-full h-fit mb-6 max-w-6xl items-start justify-start align-top gap-6 flex sm:flex-row flex-col"
    >
      <nav class="grid gap-2 text-sm text-muted-foreground  w-full sm:max-w-60">
        <Button
          v-for="item in sidebarNavItems.filter((item) => item.show)"
          :key="item.title"
          variant="ghost"
          :class="
            cn(
              'w-full text-left justify-start',
              router.currentRoute.value.name === `${item.route}` &&
                'bg-muted hover:bg-muted'
            )
          "
          as-child
        >
          <router-link :to="{ name: item.route }">
            {{ item.title }}</router-link
          >
        </Button>
      </nav>
      <router-view />
    </div>
  </div>
</template>
