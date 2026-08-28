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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "vue-sonner";
import { CopyIcon, DownloadIcon, TriangleAlertIcon } from "lucide-vue-next";
import type { EphemeralProjectApiSecret } from "@/stores/projectApiKeys";

const props = defineProps<{
  secret: EphemeralProjectApiSecret | null;
}>();

const emit = defineEmits<{
  close: [];
}>();

const { t } = useI18n();

const open = computed(() => props.secret !== null);

/** Confirmação explícita de salvamento — exigida antes de fechar/destruir. */
const confirmedSaved = ref(false);

watch(
  () => props.secret,
  () => {
    confirmedSaved.value = false;
  },
);

const title = computed(() =>
  props.secret?.kind === "rotated"
    ? t("project_api_keys.secret_title_rotated")
    : t("project_api_keys.secret_title_created"),
);

const rotationPolicyMessage = computed(() => {
  if (!props.secret || props.secret.kind !== "rotated") return null;

  if (props.secret.rotationPolicy === "immediate") {
    return t("project_api_keys.secret_policy_immediate");
  }

  if (props.secret.rotationPolicy === "overlap") {
    return t("project_api_keys.secret_policy_overlap", {
      date: props.secret.previousSecretValidUntil
        ? moment(props.secret.previousSecretValidUntil).format(
            "DD/MM/YYYY HH:mm",
          )
        : "-",
    });
  }

  return null;
});

/**
 * Modal bloqueante de exibição única: fechamento externo (Esc, overlay, X)
 * é ignorado — o secret só é destruído pelo botão explícito de confirmação.
 */
function ignoreExternalClose() {
  // intencionalmente vazio
}

async function copySecret() {
  if (!props.secret) return;

  try {
    await navigator.clipboard.writeText(props.secret.secret);
    toast(t("project_api_keys.secret_copied"));
  } catch {
    toast.error(t("error_ocurried"));
  }
}

/** Download opcional em arquivo texto, sempre iniciado pelo usuário. */
function downloadSecret() {
  if (!props.secret) return;

  const blob = new Blob([props.secret.secret], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${props.secret.apiKey.key_prefix}-secret.txt`;
  anchor.click();
  URL.revokeObjectURL(url);

  toast(t("project_api_keys.secret_downloaded"));
}
</script>

<template>
  <Dialog :open="open" @update:open="ignoreExternalClose">
    <DialogContent
      class="sm:max-w-lg"
      @escape-key-down.prevent
      @pointer-down-outside.prevent
      @interact-outside.prevent
    >
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription class="flex items-start gap-2">
          <TriangleAlertIcon class="size-4 mt-0.5 shrink-0 text-amber-600" />
          <span>{{ t("project_api_keys.secret_warning") }}</span>
        </DialogDescription>
      </DialogHeader>

      <div v-if="secret" class="space-y-3">
        <div class="flex items-center gap-2">
          <code
            class="flex-1 text-xs bg-muted px-3 py-2 rounded break-all select-all"
          >
            {{ secret.secret }}
          </code>
          <Button
            variant="outline"
            size="icon"
            :title="t('project_api_keys.secret_copy')"
            @click="copySecret"
          >
            <CopyIcon class="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            :title="t('project_api_keys.secret_download')"
            @click="downloadSecret"
          >
            <DownloadIcon class="size-4" />
          </Button>
        </div>

        <p v-if="rotationPolicyMessage" class="text-sm text-muted-foreground">
          {{ rotationPolicyMessage }}
        </p>

        <div class="flex items-center gap-2 pt-1">
          <Checkbox
            id="api-key-secret-saved"
            :checked="confirmedSaved"
            @update:checked="confirmedSaved = $event as boolean"
          />
          <Label
            for="api-key-secret-saved"
            class="text-sm font-normal cursor-pointer"
          >
            {{ t("project_api_keys.secret_confirm_saved") }}
          </Label>
        </div>
      </div>

      <DialogFooter>
        <Button
          class="w-full"
          :disabled="!confirmedSaved"
          @click="emit('close')"
        >
          {{ t("project_api_keys.secret_close") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
