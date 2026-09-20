<template>
  <EmailHealthBlock
    :title="t('email_health.domain_status.title')"
    :subtitle="t('email_health.domain_status.subtitle')"
    :loading="loading"
    :error="error"
    :is-empty="!domain"
    @retry="store.refreshAll()"
  >
    <template #actions>
      <Badge
        v-if="verificationLabel"
        variant="outline"
        class="text-xs font-semibold"
        :class="verified ? 'border-green-500 text-green-600' : 'border-amber-500 text-amber-600'"
      >
        {{ verificationLabel }}
      </Badge>
    </template>

    <dl class="space-y-3 text-sm">
      <div>
        <dt class="text-xs text-muted-foreground">{{ t("email_health.domain_status.permission") }}</dt>
        <dd class="font-medium">{{ permissionLabel }}</dd>
      </div>
      <div>
        <dt class="text-xs text-muted-foreground">{{ t("email_health.domain_status.added_at") }}</dt>
        <dd class="font-medium">{{ formatDateTime(domain?.google_create_time) }}</dd>
      </div>
      <div>
        <dt class="text-xs text-muted-foreground">{{ t("email_health.domain_status.last_verify") }}</dt>
        <dd class="font-medium">{{ formatDateTime(domain?.google_last_verify_time) }}</dd>
      </div>
    </dl>
  </EmailHealthBlock>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import moment from "moment";
import { storeToRefs } from "pinia";
import { Badge } from "@/components/ui/badge";
import EmailHealthBlock from "@/components/email-health/EmailHealthBlock.vue";
import { useEmailHealthStore } from "@/stores/emailHealth";

const { t, te } = useI18n();
const store = useEmailHealthStore();
const { overview, loading: sectionLoading, errors } = storeToRefs(store);

const domain = computed(() => overview.value?.domain ?? store.selectedDomain);
const loading = computed(() => sectionLoading.value.overview);
const error = computed(() => errors.value.overview);

const verified = computed(() => domain.value?.verification_state === "VERIFIED");

const verificationLabel = computed(() => {
  const state = domain.value?.verification_state;
  if (!state) return null;
  const key = `email_health.domain_status.verification.${state}`;
  return te(key) ? t(key) : state;
});

const permissionLabel = computed(() => {
  const permission = domain.value?.google_permission;
  if (!permission) return t("email_health.empty");
  const key = `email_health.domain_status.permission_value.${permission}`;
  return te(key) ? t(key) : permission;
});

function formatDateTime(value: string | null | undefined) {
  return value ? moment(value).format("DD/MM/YYYY HH:mm") : t("email_health.empty");
}
</script>
