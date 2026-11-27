<script setup lang="ts">
import { computed, type Component } from "vue";
import { Button } from "@/components/ui/button";
import {
  UserRoundIcon,
  SlidersHorizontalIcon,
  LockKeyholeIcon,
  BellIcon,
  ReceiptTextIcon,
  GaugeIcon,
  KeyRound,
} from "lucide-vue-next";
import { cn } from "@/lib/utils";
import { useRoute, RouterView } from "vue-router";
import { useWorkspaceStore } from "@/stores/workspace";
import { useMarketingApiKeysStore } from "@/stores/marketingApiKeys";
import { resolveGroupIdFromWorkspaceKey } from "@/services/marketingApiKeys";

type NavItem = { title: string; route: string; icon: Component; show: boolean };
type NavGroup = { title: string; items: NavItem[] };

const route = useRoute();
const workspaceStore = useWorkspaceStore();
const marketingApiKeysStore = useMarketingApiKeysStore();

// Capability administrativa (dono do grupo ou `manage-marketing-api-keys`)
// sobre o workspace atualmente selecionado.
const canManageMarketingApiKeys = computed(() =>
  marketingApiKeysStore.canManageGroup(
    resolveGroupIdFromWorkspaceKey(workspaceStore.activeGroupProject?.id),
  ),
);

const navGroups = computed<NavGroup[]>(() =>
  [
    {
      title: "Conta",
      items: [
        { title: "Perfil", route: "configurations.profile", icon: UserRoundIcon, show: true },
        { title: "Preferências", route: "configurations.preferences", icon: SlidersHorizontalIcon, show: true },
        { title: "Segurança", route: "configurations.security", icon: LockKeyholeIcon, show: true },
        { title: "Notificações", route: "configurations.notifications", icon: BellIcon, show: true },
      ],
    },
    {
      title: "Cobrança",
      items: [
        { title: "Faturas", route: "invoices.index", icon: ReceiptTextIcon, show: true },
        { title: "Consumo", route: "service-consumeds.index", icon: GaugeIcon, show: true },
      ],
    },
    {
      title: "Integrações",
      items: [
        { title: "API Keys", route: "configurations.api-keys", icon: KeyRound, show: canManageMarketingApiKeys.value },
      ],
    },
  ]
    .map((group) => ({ ...group, items: group.items.filter((item) => item.show) }))
    .filter((group) => group.items.length > 0),
);

const navItems = computed(() => navGroups.value.flatMap((group) => group.items));

const activeRoute = computed(() => route.meta.navRoute ?? route.name);
const isActive = (item: NavItem) => activeRoute.value === item.route;
</script>

<template>
  <div class="mx-auto w-full max-w-5xl pb-10">
    <div class="flex flex-col gap-6 md:flex-row md:gap-10">
      <nav class="md:w-52 md:shrink-0">
        <div class="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 md:hidden">
          <Button
            v-for="item in navItems"
            :key="item.route"
            variant="ghost"
            size="sm"
            :class="cn('shrink-0', isActive(item) ? 'bg-muted hover:bg-muted' : 'text-muted-foreground')"
            as-child
          >
            <router-link :to="{ name: item.route }">
              <component :is="item.icon" class="size-4" />
              {{ item.title }}
            </router-link>
          </Button>
        </div>

        <div class="hidden md:sticky md:top-4 md:flex md:flex-col md:gap-6">
          <div v-for="group in navGroups" :key="group.title" class="flex flex-col gap-1">
            <p class="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {{ group.title }}
            </p>
            <Button
              v-for="item in group.items"
              :key="item.route"
              variant="ghost"
              :class="
                cn(
                  'w-full justify-start font-normal',
                  isActive(item)
                    ? 'bg-muted font-medium text-foreground hover:bg-muted'
                    : 'text-muted-foreground',
                )
              "
              as-child
            >
              <router-link :to="{ name: item.route }">
                <component :is="item.icon" class="size-4" />
                {{ item.title }}
              </router-link>
            </Button>
          </div>
        </div>
      </nav>

      <div class="min-w-0 flex-1">
        <RouterView />
      </div>
    </div>
  </div>
</template>
