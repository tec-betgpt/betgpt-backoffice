<template>
  <div class="email-health-page p-10 max-[450px]:p-0 pb-16 w-full">
    <EmailHealthHeader />

    <div v-if="loadingDomains" class="space-y-4">
      <Skeleton class="h-8 w-1/3" />
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton v-for="index in 3" :key="index" class="h-80 w-full" />
      </div>
      <Skeleton class="h-48 w-full" />
    </div>

    <Card v-else-if="domainsError">
      <CardContent class="pt-6">
        <EmailHealthEmptyState variant="error" @retry="reload" />
      </CardContent>
    </Card>

    <Card v-else-if="!store.domains.length">
      <CardContent class="pt-6">
        <EmailHealthEmptyState :message="t('email_health.no_domains_title')" />
        <p class="text-center text-xs text-muted-foreground -mt-6 pb-6">
          {{ t("email_health.no_domains_description") }}
        </p>
      </CardContent>
    </Card>

    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DomainStatusCard />
        <DeliveryReputationCard />
        <SpamRateCard />
      </div>

      <div class="mt-4">
        <CompliancePanel />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <FeedbackLoopPanel />
        <AuthenticationPanel />
        <EncryptionPanel />
        <DeliveryErrorsPanel />
      </div>

      <div class="mt-4">
        <AdminPanel />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceStore } from "@/stores/workspace";
import { useEmailHealthStore } from "@/stores/emailHealth";
import EmailHealthHeader from "@/components/email-health/EmailHealthHeader.vue";
import EmailHealthEmptyState from "@/components/email-health/EmailHealthEmptyState.vue";
import DomainStatusCard from "@/components/email-health/DomainStatusCard.vue";
import DeliveryReputationCard from "@/components/email-health/DeliveryReputationCard.vue";
import SpamRateCard from "@/components/email-health/SpamRateCard.vue";
import CompliancePanel from "@/components/email-health/CompliancePanel.vue";
import FeedbackLoopPanel from "@/components/email-health/FeedbackLoopPanel.vue";
import AuthenticationPanel from "@/components/email-health/AuthenticationPanel.vue";
import EncryptionPanel from "@/components/email-health/EncryptionPanel.vue";
import DeliveryErrorsPanel from "@/components/email-health/DeliveryErrorsPanel.vue";
import AdminPanel from "@/components/email-health/AdminPanel.vue";

const { t } = useI18n();
const workspaceStore = useWorkspaceStore();
const store = useEmailHealthStore();
const { loading, errors } = storeToRefs(store);

const loadingDomains = computed(() => loading.value.domains);
const domainsError = computed(() => errors.value.domains);

function reload() {
  const filterId = workspaceStore.activeGroupProject?.id;
  if (filterId) void store.loadDomains(filterId);
}

watch(
  () => workspaceStore.activeGroupProject?.id,
  (filterId) => {
    if (filterId) void store.loadDomains(filterId);
  },
  { immediate: true },
);
</script>
