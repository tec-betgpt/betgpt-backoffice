<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ChartNoAxesColumn, Megaphone, Settings2 } from "lucide-vue-next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectTab from "@/components/project-preferences/ProjectTab.vue";
import GoogleAnalyticsTab from "@/components/project-preferences/GoogleAnalyticsTab.vue";
import MetaAdsTab from "@/components/project-preferences/MetaAdsTab.vue";
import {
  DEFAULT_PREFERENCES_TAB,
  resolvePreferencesTab,
  type PreferencesTab,
} from "@/components/project-preferences/preferencesTabs";

const route = useRoute();
const router = useRouter();

const activeTab = computed<PreferencesTab>({
  get: () => resolvePreferencesTab(route.query.tab),
  set: (tab) => {
    router.replace({
      query: {
        ...route.query,
        tab: tab === DEFAULT_PREFERENCES_TAB ? undefined : tab,
      },
    });
  },
});
</script>

<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight flex items-center gap-2">
        <Settings2 class="h-5 w-5" />
        Preferências do Projeto
      </h2>
      <p class="text-muted-foreground">
        Configure as preferências do projeto e das integrações em um só lugar.
      </p>
    </div>

    <Tabs v-model="activeTab" class="space-y-2">
      <TabsList class="w-full justify-start overflow-x-auto">
        <TabsTrigger value="projeto">
          <Settings2 class="mr-2 h-4 w-4" />
          Projeto
        </TabsTrigger>
        <TabsTrigger value="google-analytics">
          <ChartNoAxesColumn class="mr-2 h-4 w-4" />
          Google Analytics
        </TabsTrigger>
        <TabsTrigger value="meta-ads">
          <Megaphone class="mr-2 h-4 w-4" />
          Meta Ads
        </TabsTrigger>
      </TabsList>

      <TabsContent value="projeto" class="mt-4">
        <ProjectTab />
      </TabsContent>
      <TabsContent value="google-analytics" class="mt-4">
        <GoogleAnalyticsTab />
      </TabsContent>
      <TabsContent value="meta-ads" class="mt-4">
        <MetaAdsTab />
      </TabsContent>
    </Tabs>
  </div>
</template>
