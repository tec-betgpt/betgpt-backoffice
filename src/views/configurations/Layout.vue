<script setup lang="ts">
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter, RouterView } from "vue-router";
import { useWorkspaceStore } from "@/stores/workspace";

const workspaceStore = useWorkspaceStore();
const activeGroupProject = workspaceStore.activeGroupProject;

const sidebarNavItems: Item[] = [
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
  {
    title: "Projetos",
    route: "configurations.projects",
    show: true,
  },
  {
    title: "Integrações",
    route: "configurations.integrations",
    show: activeGroupProject.type === "project",
  },
];

const router = useRouter();
</script>

<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Configurações</h2>
      <p class="text-muted-foreground">
        Gerencie as configurações das suas contas e preferências de e-mail.
      </p>
    </div>
    <Separator class="my-6" />
    <div
      class="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]"
    >
      <nav class="grid gap-2 text-sm text-muted-foreground">
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
      <div class="grid gap-6">
        <div class="space-y-6">
          <router-view />
        </div>
      </div>
    </div>
  </div>
</template>
