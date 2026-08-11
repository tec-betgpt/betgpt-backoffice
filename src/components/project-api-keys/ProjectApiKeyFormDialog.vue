<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import moment from "moment";
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
import { Badge } from "@/components/ui/badge";
import { TriangleAlertIcon, InfoIcon } from "lucide-vue-next";
import {
  PROJECT_API_KEY_NAME_MAX_LENGTH,
  PROJECT_API_KEY_NAME_MIN_LENGTH,
  PROJECT_API_KEY_RATE_LIMIT_DEFAULT,
  PROJECT_API_KEY_RATE_LIMIT_MAX,
  PROJECT_API_KEY_RATE_LIMIT_MIN,
  PROJECT_API_SCOPE_GROUPS,
} from "@/contracts/projectApiKeys";
import type {
  IssueProjectApiKeyRequest,
  ProjectApiKey,
  ProjectApiScope,
} from "@/contracts/projectApiKeys";

/** Erros de campo devolvidos pelo backend (422), já traduzidos para exibição. */
type ProjectApiKeyFormServerErrors = Partial<
  Record<"name" | "scopes" | "rate_limit_per_minute" | "expires_at", string>
>;

const props = withDefaults(
  defineProps<{
    open: boolean;
    submitting: boolean;
    mode?: "create" | "edit";
    /** Chave em edição (obrigatória quando `mode === "edit"`). */
    initial?: ProjectApiKey | null;
    /** Erros de campo do 422 mapeados pela view. */
    serverErrors?: ProjectApiKeyFormServerErrors | null;
  }>(),
  { mode: "create", initial: null, serverErrors: null },
);

const emit = defineEmits<{
  "update:open": [value: boolean];
  submit: [payload: IssueProjectApiKeyRequest];
}>();

const { t } = useI18n();

const name = ref("");
/** Menor privilégio: na criação, nenhum escopo pré-selecionado. */
const selectedScopes = ref<ProjectApiScope[]>([]);
const expiresAt = ref("");
const rateLimit = ref<number>(PROJECT_API_KEY_RATE_LIMIT_DEFAULT);
const attemptedSubmit = ref(false);

// Inicializa o formulário sempre que o diálogo é aberto.
watch(
  () => props.open,
  (open) => {
    if (!open) return;

    if (props.mode === "edit" && props.initial) {
      name.value = props.initial.name;
      selectedScopes.value = [...props.initial.scopes];
      expiresAt.value = props.initial.expires_at
        ? moment(props.initial.expires_at).format("YYYY-MM-DDTHH:mm")
        : "";
      rateLimit.value = props.initial.rate_limit_per_minute;
    } else {
      name.value = "";
      selectedScopes.value = [];
      expiresAt.value = "";
      rateLimit.value = PROJECT_API_KEY_RATE_LIMIT_DEFAULT;
    }

    attemptedSubmit.value = false;
  },
);

const scopeGroups = PROJECT_API_SCOPE_GROUPS;

const isEdit = computed(() => props.mode === "edit");

function scopeLabelKey(scope: ProjectApiScope): string {
  return `project_api_keys.scopes.${scope}`;
}

function isScopeChecked(scope: ProjectApiScope): boolean {
  return selectedScopes.value.includes(scope);
}

function toggleScope(scope: ProjectApiScope, checked: boolean) {
  selectedScopes.value = checked
    ? [...selectedScopes.value, scope]
    : selectedScopes.value.filter((item) => item !== scope);
}

// --- Comparação de escopos (modo edição) ------------------------------------

const addedScopes = computed(() =>
  isEdit.value
    ? selectedScopes.value.filter(
        (scope) => !props.initial?.scopes.includes(scope),
      )
    : [],
);

const removedScopes = computed(() =>
  isEdit.value
    ? (props.initial?.scopes ?? []).filter(
        (scope) => !selectedScopes.value.includes(scope),
      )
    : [],
);

const hasScopeChanges = computed(
  () => addedScopes.value.length > 0 || removedScopes.value.length > 0,
);

/** Expiração antecipada: definir expiração onde não havia ou para data anterior. */
const isExpiringEarlier = computed(() => {
  if (!isEdit.value || !expiresAt.value) return false;

  const next = new Date(expiresAt.value).getTime();
  const previous = props.initial?.expires_at
    ? new Date(props.initial.expires_at).getTime()
    : null;

  return previous === null || next < previous;
});

/** Mudanças com impacto imediato nas integrações em produção. */
const hasImmediateImpact = computed(
  () => isEdit.value && (removedScopes.value.length > 0 || isExpiringEarlier.value),
);

// --- Validação (cliente + erros de campo do 422) ------------------------------

const nameError = computed(() => {
  if (props.serverErrors?.name) return props.serverErrors.name;
  const length = name.value.trim().length;
  return length < PROJECT_API_KEY_NAME_MIN_LENGTH ||
    length > PROJECT_API_KEY_NAME_MAX_LENGTH
    ? t("project_api_keys.validation_name")
    : null;
});

const scopesError = computed(() => {
  if (props.serverErrors?.scopes) return props.serverErrors.scopes;
  return selectedScopes.value.length === 0
    ? t("project_api_keys.validation_scopes")
    : null;
});

const expirationError = computed(() => {
  if (props.serverErrors?.expires_at) return props.serverErrors.expires_at;
  if (!expiresAt.value) return null;
  return new Date(expiresAt.value).getTime() <= Date.now()
    ? t("project_api_keys.validation_expiration")
    : null;
});

const rateLimitError = computed(() => {
  if (props.serverErrors?.rate_limit_per_minute)
    return props.serverErrors.rate_limit_per_minute;
  const value = Number(rateLimit.value);
  return !Number.isInteger(value) ||
    value < PROJECT_API_KEY_RATE_LIMIT_MIN ||
    value > PROJECT_API_KEY_RATE_LIMIT_MAX
    ? t("project_api_keys.validation_rate_limit")
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

  // Somente campos editáveis — projeto, uuid, status e atores são imutáveis
  // (qualquer outro campo retorna 422 `immutable_fields`).
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
        <DialogTitle>
          {{
            isEdit
              ? t("project_api_keys.edit_title")
              : t("project_api_keys.create_title")
          }}
        </DialogTitle>
        <DialogDescription>
          {{
            isEdit
              ? t("project_api_keys.edit_description")
              : t("project_api_keys.create_description")
          }}
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-5" @submit.prevent="handleSubmit">
        <div
          v-if="isEdit && initial?.status === 'expired'"
          class="flex items-start gap-2 text-sm text-muted-foreground border rounded-lg p-3"
        >
          <InfoIcon class="size-4 mt-0.5 shrink-0" />
          <span>{{ t("project_api_keys.edit_expired_hint") }}</span>
        </div>

        <div class="space-y-2">
          <Label for="api-key-name">{{ t("project_api_keys.field_name") }}</Label>
          <Input
            id="api-key-name"
            v-model="name"
            :placeholder="t('project_api_keys.field_name_placeholder')"
            :maxlength="PROJECT_API_KEY_NAME_MAX_LENGTH"
          />
          <p
            v-if="attemptedSubmit && nameError"
            class="text-sm text-destructive"
          >
            {{ nameError }}
          </p>
        </div>

        <div class="space-y-2">
          <Label>{{ t("project_api_keys.field_scopes") }}</Label>
          <div class="border rounded-lg divide-y max-h-64 overflow-y-auto">
            <div
              v-for="group in scopeGroups"
              :key="group.domain"
              class="p-3 space-y-2"
            >
              <p class="text-sm font-medium">
                {{ t(`project_api_keys.scope_group_${group.domain}`) }}
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

          <!-- Comparação de escopos adicionados/removidos antes de salvar -->
          <div
            v-if="isEdit && hasScopeChanges"
            class="border rounded-lg p-3 space-y-2"
          >
            <p class="text-sm font-medium">
              {{ t("project_api_keys.scopes_diff_title") }}
            </p>
            <div v-if="addedScopes.length" class="flex flex-wrap items-center gap-1">
              <span class="text-xs text-muted-foreground">
                {{ t("project_api_keys.scopes_added") }}:
              </span>
              <Badge
                v-for="scope in addedScopes"
                :key="`added-${scope}`"
                variant="outline"
                class="text-xs border-green-600 text-green-700"
              >
                + {{ scope }}
              </Badge>
            </div>
            <div v-if="removedScopes.length" class="flex flex-wrap items-center gap-1">
              <span class="text-xs text-muted-foreground">
                {{ t("project_api_keys.scopes_removed") }}:
              </span>
              <Badge
                v-for="scope in removedScopes"
                :key="`removed-${scope}`"
                variant="outline"
                class="text-xs border-destructive text-destructive"
              >
                − {{ scope }}
              </Badge>
            </div>
          </div>
        </div>

        <div class="grid sm:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="api-key-expires-at">
              {{ t("project_api_keys.field_expires_at") }}
            </Label>
            <Input id="api-key-expires-at" v-model="expiresAt" type="datetime-local" />
            <p class="text-xs text-muted-foreground">
              {{ t("project_api_keys.field_expires_at_hint") }}
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
              {{ t("project_api_keys.field_rate_limit") }}
            </Label>
            <Input
              id="api-key-rate-limit"
              v-model.number="rateLimit"
              type="number"
              :min="PROJECT_API_KEY_RATE_LIMIT_MIN"
              :max="PROJECT_API_KEY_RATE_LIMIT_MAX"
            />
            <p class="text-xs text-muted-foreground">
              {{ t("project_api_keys.field_rate_limit_hint") }}
            </p>
            <p
              v-if="attemptedSubmit && rateLimitError"
              class="text-sm text-destructive"
            >
              {{ rateLimitError }}
            </p>
          </div>
        </div>

        <!-- Aviso de impacto imediato (redução de escopos / expiração antecipada) -->
        <div
          v-if="hasImmediateImpact"
          class="flex items-start gap-2 text-sm border border-amber-500/50 bg-amber-500/10 rounded-lg p-3"
        >
          <TriangleAlertIcon class="size-4 mt-0.5 shrink-0 text-amber-600" />
          <span>{{ t("project_api_keys.impact_warning") }}</span>
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
            <template v-if="submitting">
              {{
                isEdit
                  ? t("project_api_keys.edit_submitting")
                  : t("project_api_keys.create_submitting")
              }}
            </template>
            <template v-else>
              {{
                isEdit
                  ? t("project_api_keys.edit_submit")
                  : t("project_api_keys.create_submit")
              }}
            </template>
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
