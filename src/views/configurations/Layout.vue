<script setup lang="ts">
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter, RouterView } from "vue-router";

const sidebarNavItems: Item[] = [
  {
    title: "Perfil",
    route: "configurations.profile",
  },
  {
    title: "Segurança",
    route: "configurations.security",
  },
  {
    title: "Notificações",
    route: "configurations.notifications",
  },
  {
    title: "Projetos",
    route: "configurations.projects",
  },
  {
    title: "Integrações",
    route: "configurations.projects",
  },
];

const router = useRouter();
</script>

<template>
  <div class="space-y-6 p-10 pb-16">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Configurações</h2>
      <p class="text-muted-foreground">
        Gerencie as configurações das suas contas e preferências de e-mail.
      </p>
    </div>
    <Separator class="my-6" />
    <div class="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
      <aside class="-mx-4 lg:w-1/5">
        <nav class="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
          <Button
            v-for="item in sidebarNavItems"
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
      </aside>
      <div class="flex-1 lg:max-w-2xl">
        <div class="space-y-6">
          <router-view />
        </div>
      </div>
    </div>
  </div>
</template>
