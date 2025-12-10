<template>
  <SidebarProvider :defaultOpen="false">
    <LeftMenuComponent
      v-model:sidebarExpanded="sidebarExpanded"
    />
    <SidebarInset>
      <header
        class="flex sticky z-30 top-0 bg-background/5 backdrop-blur-md h-16 shrink-0 items-center gap-2 px-4"
      >
        <div class="flex items-center gap-2 w-full px-4">
          <SidebarTrigger :logo="true" :toggle="toggleSidebar" class="-ml-1" />

          <Separator orientation="vertical" class="mr-2 h-4 hidden md:block" />

          <Breadcrumb class="flex-1">
            <BreadcrumbList class="flex flex-nowrap">
              <BreadcrumbItem>
                <BreadcrumbLink as-child>
                  <Avatar
                    @click="toggleSidebar"
                    v-if="activeGroupProject"
                    shape="square"
                    class="size-6"
                  >
                    <AvatarImage
                      v-if="activeGroupProject && activeGroupProject.logo"
                      :src="activeGroupProject.logo"
                    />
                    <AvatarImage v-else src="/default-project.jpg" />
                    <AvatarFallback class="uppercase text-dark">
                      {{ activeGroupProject.name.slice(0, 2) }}
                    </AvatarFallback>
                  </Avatar>
                  <Avatar
                    @click="toggleSidebar"
                    v-else
                    shape="square"
                    class="size-6"
                  >
                    <AvatarImage src="/default-project.jpg" />
                  </Avatar>
                </BreadcrumbLink>
                <BreadcrumbSeparator />
              </BreadcrumbItem>

              <div
                v-for="(crumb, index) in breadcrumbs"
                :key="index"
                class="flex flex-nowrap items-center"
              >
                <BreadcrumbItem
                  :class="{
                    'hidden md:block': index !== breadcrumbs.length - 1,
                    flex: index === breadcrumbs.length - 1,
                  }"
                >
                  <BreadcrumbLink v-if="crumb.path" as-child>
                    <router-link
                      class="truncate whitespace-nowrap overflow-hidden max-w-[100px] md:max-w-xs"
                      :to="{ path: crumb.path }"
                    >
                      {{ crumb.title }}
                    </router-link>
                  </BreadcrumbLink>

                  <BreadcrumbPage
                    v-else
                    class="truncate whitespace-nowrap overflow-hidden max-w-[100px] md:max-w-xs"
                  >
                    {{ crumb.title }}
                  </BreadcrumbPage>
                </BreadcrumbItem>

                <BreadcrumbSeparator
                  class="hidden md:block ml-2"
                  v-if="index < breadcrumbs.length - 1"
                />
              </div>
            </BreadcrumbList>
          </Breadcrumb>

          <button @click="toggleValues()" class="mr-3">
            <Eye v-if="isShowValues" class="w-5 h-5 text-primary" />
            <EyeClosed v-else class="w-5 h-5 text-primary" />
          </button>

          <SidebarTrigger
            :logo="false"
            :toggle="toggleSidebarIA"
            :logoCustom="logoCustomAi"
            class="-ml-1"
          />
        </div>
      </header>
      <CustomLoading v-if="configStore.loading" />
      <main
        v-else
        class="grid flex-1 items-start gap-4 p-4 pt-0 sm:px-6 sm:py-0"
      >
        <div class="mx-auto w-full min-w-0">
          <router-view :isShowValues="isShowValues"></router-view>
        </div>
      </main>
    </SidebarInset>

    <RightMenuComponent v-model:sidebarAi="sidebarAi" />
  </SidebarProvider>
</template>

<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  SidebarTrigger,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { EyeClosed, Eye } from "lucide-vue-next";
import { useColorMode } from "@vueuse/core";
import CustomLoading from "@/components/custom/CustomLoading.vue";
import { useConfigStore } from "@/stores/config";
import { Separator } from "@/components/ui/separator";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAuthStore } from "@/stores/auth";
import { useRoute, useRouter } from "vue-router";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { toast } from "@/components/ui/toast";
import Projects from "@/services/projects";
import LeftMenuComponent from "@/components/layout/LeftMenuComponent.vue";
import RightMenuComponent from "@/components/layout/RightMenuComponent.vue";

interface BreadcrumbItem {
  name: string;
  title: string;
  path: string | null;
}

const DARK_LOGOS = {
  square: "/logo-elevate-square-white.png",
  full: "/logo-elevate-white.png",
};

const LIGHT_LOGOS = {
  square: "/logo-elevate-square-black.png",
  full: "/logo-elevate-black.png",
};

// Refs e stores
const sidebarExpanded = ref(false);
const sidebarAi = ref(false);
const mode: any = useColorMode();
const workspaceStore = useWorkspaceStore();
const authStore = useAuthStore();
const configStore = useConfigStore();
const route = useRoute();
const router = useRouter();

const isShowValues = ref(false);

// Computed
const activeGroupProject = computed(
  () => workspaceStore.activeGroupProject || null
);

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = [];

  route.matched.forEach((record, index) => {
    const name = record.name as string;
    const title = record.meta.title as string;
    items.push({
      name,
      title,
      path: index === route.matched.length - 1 ? null : record.path,
    });
  });

  return items;
});

const logoCustomAi = computed(() => {
  return mode.value === "dark"
    ? "/svg/logo-ia-v1-white.svg"
    : "/svg/logo-ia-v1-black.svg";
});

// Methods
const toggleValues = () => {
  isShowValues.value = !isShowValues.value;
};

const toggleSidebar = () => {
  sidebarExpanded.value = !sidebarExpanded.value;
};

const toggleSidebarIA = () => {
  localStorage.setItem("sidebarAi", sidebarAi.value ? "0" : "1");
  sidebarAi.value = !sidebarAi.value;
};

const minSwipeDistance = 60;
const edgeArea = 48;
const touch = {
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0,
};

const onTouchStart = (e: TouchEvent) => {
  const touchEvent = e.changedTouches[0];
  touch.startX = touchEvent.clientX;
  touch.startY = touchEvent.clientY;
  touch.endX = touchEvent.clientX;
  touch.endY = touchEvent.clientY;
};
const onTouchMove = (e: TouchEvent) => {
  const touchEvent = e.changedTouches[0];
  touch.endX = touchEvent.clientX;
  touch.endY = touchEvent.clientY;
};
const onTouchEnd = () => {
  const deltaX = touch.endX - touch.startX;
  const deltaY = Math.abs(touch.endY - touch.startY);

  if (deltaY > 60) return;

  if (deltaX > minSwipeDistance && touch.startX < edgeArea) {
    sidebarExpanded.value = true;
    sidebarAi.value = false;
  }

  if (
    deltaX < -minSwipeDistance &&
    touch.startX > window.innerWidth - edgeArea
  ) {
    sidebarAi.value = true;
    sidebarExpanded.value = false;
  }

  if (
    deltaX < -minSwipeDistance &&
    sidebarExpanded.value &&
    touch.startX < 240
  ) {
    sidebarExpanded.value = false;
  }

  if (
    deltaX > minSwipeDistance &&
    sidebarAi.value &&
    touch.startX > window.innerWidth - 240
  ) {
    sidebarAi.value = false;
  }
};

const swipeSidebars = () => {
  const isMobile = window.innerWidth < 1024;
  if (!isMobile) return;

  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
};

const fetchStatusOAuth2 = async () => {
  try {
   const response = await Projects.statusOAuth({project_id:workspaceStore.activeGroupProject.project_id})
    if (response.data.length === 0) return;
    const status = response.data
    status.forEach((item) => {
      toast({
        variant:'destructive',
        description:item.status_description,
        duration:3000,
        title:item.name,
      })
    })
  } catch (e) {
    console.error(e)
  }
}

onUnmounted(() => {
  window.removeEventListener("touchstart", onTouchStart);
  window.removeEventListener("touchmove", onTouchMove);
  window.removeEventListener("touchend", onTouchEnd);
});

onMounted(async () => {
  mode.value = localStorage.getItem("theme") || "auto";
  const user = authStore.user;

  if (user) {
    await workspaceStore.loadInitialData(user.preferences, user.group_projects);
    fetchStatusOAuth2()
  }

  swipeSidebars();
});
</script>
<style>
.loading-dots {
  display: flex;
  justify-content: start;
  align-items: flex-end;
  font-size: 2rem;
  height: 2.5rem; /* altura do container */
}

.loading-dots span {
  display: inline-block;
  margin: 0 0.1rem;
  animation: bounce 0.8s infinite ease-in-out;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.3;
  }
  40% {
    transform: translateY(-10px);
    opacity: 1;
  }
}
</style>
