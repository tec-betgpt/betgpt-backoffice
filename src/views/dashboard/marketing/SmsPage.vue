<template>
  <Tabs :model-value="activeTab" class="w-full" @update:modelValue="changeTab">
    <div class="space-y-5 p-10 pb-0 max-[450px]:p-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">SMS</h2>
        <p class="text-muted-foreground">Templates, envios e automações do canal em um único lugar.</p>
      </div>
      <TabsList class="flex w-full justify-start overflow-x-auto">
        <TabsTrigger value="templates">Templates</TabsTrigger>
        <TabsTrigger value="test">Teste</TabsTrigger>
        <TabsTrigger value="lists">Listas</TabsTrigger>
        <TabsTrigger value="automations">Automações</TabsTrigger>
        <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
        <TabsTrigger value="direct-send">Envio Direto</TabsTrigger>
        <TabsTrigger value="history">Histórico</TabsTrigger>
      </TabsList>
    </div>

    <TabsContent value="templates" class="px-10 pb-16 pt-6 max-[450px]:p-2">
      <MarketingAssetsPage channel="sms" embedded />
    </TabsContent>
    <TabsContent value="test"><SmsTestMessage /></TabsContent>
    <TabsContent value="lists"><SmsProviderLists /></TabsContent>
    <TabsContent value="automations"><SmsProviderAutomations /></TabsContent>
    <TabsContent value="broadcasts"><SmsProviderBroadcasts /></TabsContent>
    <TabsContent value="direct-send"><SmsDirectSend /></TabsContent>
    <TabsContent value="history"><SmsHistory /></TabsContent>
  </Tabs>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MarketingAssetsPage from "@/components/marketing/MarketingAssetsPage.vue";
import SmsTestMessage from "@/views/dashboard/SmsTestMessage.vue";
import SmsProviderLists from "@/views/dashboard/SmsProviderLists.vue";
import SmsProviderAutomations from "@/views/dashboard/SmsProviderAutomations.vue";
import SmsProviderBroadcasts from "@/views/dashboard/SmsProviderBroadcasts.vue";
import SmsDirectSend from "@/views/dashboard/SmsDirectSend.vue";
import SmsHistory from "@/views/dashboard/SmsHistory.vue";

const TABS = ["templates", "test", "lists", "automations", "broadcasts", "direct-send", "history"];
const route = useRoute();
const router = useRouter();
const activeTab = computed(() => {
  const tab = String(route.query.tab ?? "templates");
  return TABS.includes(tab) ? tab : "templates";
});

function changeTab(value: unknown) {
  router.replace({ name: "marketing.sms", query: { ...route.query, tab: String(value) } });
}
</script>
