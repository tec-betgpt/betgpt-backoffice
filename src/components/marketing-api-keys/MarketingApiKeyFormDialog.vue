<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MARKETING_API_KEY_NAME_MAX_LENGTH,
  MARKETING_API_KEY_NAME_MIN_LENGTH,
  MARKETING_API_KEY_RATE_LIMIT_DEFAULT,
  MARKETING_API_KEY_RATE_LIMIT_MAX,
  MARKETING_API_KEY_RATE_LIMIT_MIN,
  MARKETING_API_SCOPE_GROUPS,
} from "@/contracts/marketingApiKeys";
import type {
  CreateMarketingApiKeyPayload,
  MarketingApiScope,
} from "@/contracts/marketingApiKeys";

const props = defineProps<{
  open: boolean;
  submitting: boolean;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  submit: [payload: CreateMarketingApiKeyPayload];
}>();

const { t } = useI18n();

const name = ref("");
/** Menor privilégio: nenhum escopo pré-selecionado. */
const selectedScopes = ref<MarketingApiScope[]>([]);
const expiresAt = ref("");
const rateLimit = ref<number>(MARKETING_API_KEY_RATE_LIMIT_DEFAULT);
const attemptedSubmit = ref(false);

// Reseta o formulário sempre que o diálogo é aberto.
watch(
  () => props.open,
  (open) => {
    if (!open) return;
    name.value = "";
    selectedScopes.value = [];
    expiresAt.value = "";
    rateLimit.value = MARKETING_API_KEY_RATE_LIMIT_DEFAULT;
    attemptedSubmit.value = false;
  },
);

const scopeGroups = MARKETING_API_SCOPE_GROUPS;

function scopeLabelKey(scope: MarketingApiScope): string {
  return `marketing_api_keys.scope_${scope.replace(":", "_")}`;
}

function isScopeChecked(scope: MarketingApiScope): boolean {
  return selectedScopes.value.includes(scope);
}

function toggleScope(scope: MarketingApiScope, checked: boolean) {
  selectedScopes.value = checked
    ? [...selectedScopes.value, scope]
    : selectedScopes.value.filter((item) => item !== scope);
}

const nameError = computed(() => {
  const length = name.value.trim().length;
  return length < MARKETING_API_KEY_NAME_MIN_LENGTH ||
    length > MARKETING_API_KEY_NAME_MAX_LENGTH
    ? t("marketing_api_keys.validation_name")
    : null;
});

const scopesError = computed(() =>
  selectedScopes.value.length === 0
    ? t("marketing_api_keys.validation_scopes")
    : null,
);

const expirationError = computed(() => {
  if (!expiresAt.value) return null;
  return new Date(expiresAt.value).getTime() <= Date.now()
    ? t("marketing_api_keys.validation_expiration")
    : null;
});

const rateLimitError = computed(() => {
  const value = Number(rateLimit.value);
  return !Number.isInteger(value) ||
    value < MARKETING_API_KEY_RATE_LIMIT_MIN ||
    value > MARKETING_API_KEY_RATE_LIMIT_MAX
    ? t("marketing_api_keys.validation_rate_limit")
    : null;
});

const isValid = computed(
  () =>
    !nameError.value &&
    !scopesError.value &&
    !expirationError.value &&
    !rateLimitError.value,
);

function handleSubmit() {
  attemptedSubmit.value = true;
  if (!isValid.value || props.submitting) return;

  emit("submit", {
    name: name.value.trim(),
    scopes: selectedScopes.value,
    rate_limit_per_minute: Number(rateLimit.value),
    expires_at: expiresAt.value
      ? new Date(expiresAt.value).toISOString()
      : null,
  });
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{{ t("marketing_api_keys.create_title") }}</DialogTitle>
        <DialogDescription>
          {{ t("marketing_api_keys.create_description") }}
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-5" @submit.prevent="handleSubmit">
        <div class="space-y-2">
          <Label for="api-key-name">{{ t("marketing_api_keys.field_name") }}</Label>
          <Input
            id="api-key-name"
            v-model="name"
            :placeholder="t('marketing_api_keys.field_name_placeholder')"
            :maxlength="MARKETING_API_KEY_NAME_MAX_LENGTH"
          />
          <p
            v-if="attemptedSubmit && nameError"
            class="text-sm text-destructive"
          >
            {{ nameError }}
          </p>
        </div>

        <div class="space-y-2">
          <Label>{{ t("marketing_api_keys.field_scopes") }}</Label>
          <div class="border rounded-lg divide-y max-h-64 overflow-y-auto">
            <div
              v-for="group in scopeGroups"
              :key="group.domain"
              class="p-3 space-y-2"
            >
              <p class="text-sm font-medium">
                {{ t(`marketing_api_keys.scope_group_${group.domain}`) }}
              </p>
              <div
                v-for="scope in group.scopes"
                :key="scope"
                class="flex items-center gap-2"
              >
                <Checkbox
                  :id="`scope-${scope}`"
                  :checked="isScopeChecked(scope)"
                  @update:checked="toggleScope(scope, $event as boolean)"
                />
                <Label :for="`scope-${scope}`" class="font-normal cursor-pointer">
                  {{ t(scopeLabelKey(scope)) }}
                  <span class="text-xs text-muted-foreground ml-1">
                    {{ scope }}
                  </span>
                </Label>
              </div>
            </div>
          </div>
          <p
            v-if="attemptedSubmit && scopesError"
            class="text-sm text-destructive"
          >
            {{ scopesError }}
          </p>
        </div>

        <div class="grid sm:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="api-key-expires-at">
              {{ t("marketing_api_keys.field_expires_at") }}
            </Label>
            <Input id="api-key-expires-at" v-model="expiresAt" type="datetime-local" />
            <p class="text-xs text-muted-foreground">
              {{ t("marketing_api_keys.field_expires_at_hint") }}
            </p>
            <p
              v-if="attemptedSubmit && expirationError"
              class="text-sm text-destructive"
            >
              {{ expirationError }}
            </p>
          </div>

          <div class="space-y-2">
            <Label for="api-key-rate-limit">
              {{ t("marketing_api_keys.field_rate_limit") }}
            </Label>
            <Input
              id="api-key-rate-limit"
              v-model.number="rateLimit"
              type="number"
              :min="MARKETING_API_KEY_RATE_LIMIT_MIN"
              :max="MARKETING_API_KEY_RATE_LIMIT_MAX"
            />
            <p class="text-xs text-muted-foreground">
              {{ t("marketing_api_keys.field_rate_limit_hint") }}
            </p>
            <p
              v-if="attemptedSubmit && rateLimitError"
              class="text-sm text-destructive"
            >
              {{ rateLimitError }}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            :disabled="submitting"
            @click="emit('update:open', false)"
          >
            {{ t("cancel") }}
          </Button>
          <Button type="submit" :disabled="submitting">
            {{
              submitting
                ? t("marketing_api_keys.create_submitting")
                : t("marketing_api_keys.create_submit")
            }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
