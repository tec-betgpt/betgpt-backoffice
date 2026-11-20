<template>
  <Tabs :model-value="activeTab" class="w-full" @update:modelValue="changeTab">
    <div class="space-y-5 p-10 pb-0 max-[450px]:p-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">E-mails</h2>
        <p class="text-muted-foreground">Templates de e-mail e configuração SMTP das campanhas.</p>
      </div>
      <TabsList>
        <TabsTrigger value="templates">Templates</TabsTrigger>
        <TabsTrigger v-if="canManageSmtp" value="smtp">SMTP</TabsTrigger>
      </TabsList>
    </div>

    <TabsContent value="templates" class="px-10 pb-16 pt-6 max-[450px]:p-2">
      <MarketingAssetsPage channel="email" embedded />
    </TabsContent>
    <TabsContent v-if="canManageSmtp" value="smtp"><CampaignMailSettings /></TabsContent>
  </Tabs>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MarketingAssetsPage from "@/components/marketing/MarketingAssetsPage.vue";
import CampaignMailSettings from "@/views/dashboard/CampaignMailSettings.vue";
import { useAuthStore } from "@/stores/auth";

const SMTP_ROLES = ["member-proprietor", "member-admin", "member-developer"];
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const canManageSmtp = computed(() =>
  (authStore.user as any)?.roles?.some((role: any) => SMTP_ROLES.includes(role.name)) ?? false,
);
const activeTab = computed(() => route.query.tab === "smtp" && canManageSmtp.value ? "smtp" : "templates");

watch(
  () => route.query.tab,
  (tab) => {
    if (tab === "smtp" && !canManageSmtp.value) changeTab("templates");
  },
  { immediate: true },
);

function changeTab(value: unknown) {
  router.replace({ name: "marketing.emails", query: { ...route.query, tab: String(value) } });
}
</script>
