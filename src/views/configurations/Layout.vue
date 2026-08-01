<script setup lang="ts">
import { computed } from "vue";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { UserRoundIcon, LucideLock, ClipboardPenIcon, MessageCircle, CreditCard, KeyRound } from "lucide-vue-next";
import { cn } from "@/lib/utils";
import { useRouter, RouterView } from "vue-router";
import { useWorkspaceStore } from "@/stores/workspace";
import { useMarketingApiKeysStore } from "@/stores/marketingApiKeys";
import { resolveGroupIdFromWorkspaceKey } from "@/services/marketingApiKeys";

const workspaceStore = useWorkspaceStore();
const marketingApiKeysStore = useMarketingApiKeysStore();

// Capability administrativa (dono do grupo ou `manage-marketing-api-keys`)
// sobre o workspace atualmente selecionado.
const canManageMarketingApiKeys = computed(() =>
  marketingApiKeysStore.canManageGroup(
    resolveGroupIdFromWorkspaceKey(workspaceStore.activeGroupProject?.id),
  ),
);

const sidebarNavItems = computed(() => [
  {
    title: "Perfil",
    route: "configurations.profile",
    show: true,
    icon: UserRoundIcon
  },
  {
    title: "Segurança",
    route: "configurations.security",
    show: true,
    icon: LucideLock
  },
  {
    title: "API Keys",
    route: "configurations.api-keys",
    show: canManageMarketingApiKeys.value,
    icon: KeyRound
  },
  {
    title: "Notificações",
    route: "configurations.notifications",
    show: true,
    icon: MessageCircle
  },
  {
    title: "Consumo",
    route: "service-consumeds.index",
    show: true,
    icon: ClipboardPenIcon
  },
  {
    title: "Faturas",
    route: "invoices.index",
    show: true,
    icon: CreditCard
  },
]);

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
      class="flex gap-4 sm:flex-row flex-col"
    >
      <nav class=" flex sm:flex-col flex-row gap-2 text-sm text-muted-foreground  w-full sm:max-w-60">
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
            <component :is="item.icon" /> {{ item.title }}
          </router-link>
        </Button>
      </nav>
      <router-view />
    </div>
  </div>
</template>
