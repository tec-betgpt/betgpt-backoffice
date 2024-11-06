<template>
  <div class="flex min-h-screen w-full flex-col bg-muted/40">
    <aside
      class="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex"
    >
      <nav class="flex flex-col items-center gap-4 px-2 sm:py-5">
        <router-link
          :to="{ name: 'home' }"
          class="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          <Package2 class="h-4 w-4 transition-all group-hover:scale-110" />
          <span class="sr-only">BetGPT</span>
        </router-link>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <router-link
                :to="{ name: 'home' }"
                class="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
              >
                <Home class="h-5 w-5" />
                <span class="sr-only">Dashboard</span>
              </router-link>
            </TooltipTrigger>
            <TooltipContent side="right">Dashboard</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <!--<TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <a
                href="#"
                class="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
              >
                <Users2 class="h-5 w-5" />
                <span class="sr-only">Clientes</span>
              </a>
            </TooltipTrigger>
            <TooltipContent side="right">Clientes</TooltipContent>
          </Tooltip> </TooltipProvider
        >-->
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <router-link
                :to="{ name: 'analytics' }"
                class="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
              >
                <LineChart class="h-5 w-5" />
                <span class="sr-only">Relatórios</span>
              </router-link>
            </TooltipTrigger>
            <TooltipContent side="right">Relatórios</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </nav>
      <nav class="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <a
                href="#"
                class="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
              >
                <Settings class="h-5 w-5" />
                <span class="sr-only">Configurações</span>
              </a>
            </TooltipTrigger>
            <TooltipContent side="right">Configurações</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </nav>
    </aside>
    <div class="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
      <header
        class="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6"
      >
        <Sheet>
          <SheetTrigger as-child>
            <Button size="icon" variant="outline" class="sm:hidden">
              <PanelLeft class="h-5 w-5" />
              <span class="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" class="sm:max-w-xs">
            <nav class="grid gap-6 text-lg font-medium">
              <router-link
                :to="{ name: 'home' }"
                class="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
              >
                <Package2
                  class="h-5 w-5 transition-all group-hover:scale-110"
                />
                <span class="sr-only">BetGPT</span>
              </router-link>
              <router-link
                :to="{ name: 'home' }"
                class="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
              >
                <Home class="h-5 w-5" />
                Dashboard
              </router-link>
              <router-link
                :to="{ name: 'analytics' }"
                class="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
              >
                <LineChart class="h-5 w-5" />
                Relatórios
              </router-link>
              <a
                href="javascritp:;"
                class="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
              >
                <Settings class="h-5 w-5" />
                Configurações
              </a>
            </nav>
          </SheetContent>
        </Sheet>
        <Breadcrumb class="hidden md:flex">
          <BreadcrumbList>
            <BreadcrumbItem v-for="(crumb, index) in breadcrumbs" :key="index">
              <template v-if="crumb.path">
                <BreadcrumbLink as-child>
                  <router-link :to="{ path: crumb.path }">{{
                    crumb.title
                  }}</router-link>
                </BreadcrumbLink>
              </template>
              <template v-else>
                <BreadcrumbPage>{{ crumb.title }}</BreadcrumbPage>
              </template>
              <BreadcrumbSeparator v-if="index < breadcrumbs.length - 1" />
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div class="relative ml-auto flex-1 md:grow-0">&nbsp;</div>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="secondary" size="icon" class="rounded-full">
              <CircleUser class="h-5 w-5" />
              <span class="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="logout">Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main class="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0">
        <router-view></router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  CircleUser,
  Home,
  PanelLeft,
  Package2,
  Settings,
  Users2,
  LineChart,
} from "lucide-vue-next";

import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

interface BreadcrumbItem {
  name: string;
  title: string;
  path: string | null;
}

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const breadcrumbs = computed(() => {
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      name: "home",
      title: "Dashboard",
      path: "/home",
    },
  ];

  // Adiciona as rotas correspondentes da hierarquia
  route.matched.forEach((routeRecord, index) => {
    const name = routeRecord.name as string;
    const title = routeRecord.meta.title as string;

    if (index === route.matched.length - 1) {
      breadcrumbItems.push({
        name,
        title,
        path: null,
      });
    } else {
      breadcrumbItems.push({
        name,
        title,
        path: routeRecord.path,
      });
    }
  });

  return breadcrumbItems;
});

const logout = async () => {
  authStore.logout();
  router.push("/login");
};
</script>
