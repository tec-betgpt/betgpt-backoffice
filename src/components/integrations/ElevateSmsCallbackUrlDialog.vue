<script setup lang="ts">
import { computed, ref, watch } from "vue";
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
import { CopyIcon, TriangleAlertIcon } from "lucide-vue-next";

const props = defineProps<{
  url: string | null;
}>();

const emit = defineEmits<{
  close: [];
}>();


const open = computed(() => props.url !== null);

/** Confirmação explícita de cópia — exigida antes de fechar/destruir a URL. */
const confirmedSaved = ref(false);

watch(
  () => props.url,
  () => {
    confirmedSaved.value = false;
  },
);

/**
 * Modal bloqueante de exibição única: fechamento externo (Esc, overlay, X)
 * é ignorado — a URL só é descartada pelo botão explícito de confirmação.
 */
function ignoreExternalClose() {
  // intencionalmente vazio
}

async function copyUrl() {
  if (!props.url) return;

  try {
    await navigator.clipboard.writeText(props.url);
    toast("URL de callback copiada.");
  } catch {
    toast.error("Não foi possível copiar a URL.");
  }
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
        <DialogTitle>URL de callback gerada</DialogTitle>
        <DialogDescription class="flex items-start gap-2">
          <TriangleAlertIcon class="size-4 mt-0.5 shrink-0 text-amber-600" />
          <span>
            Copie agora — esta URL não será exibida novamente. Se perdê-la, será
            preciso rotacionar o token (o token atual não pode ser recuperado).
          </span>
        </DialogDescription>
      </DialogHeader>

      <div v-if="url" class="space-y-3">
        <div class="flex items-center gap-2">
          <code
            class="flex-1 text-xs bg-muted px-3 py-2 rounded break-all select-all"
          >
            {{ url }}
          </code>
          <Button
            variant="outline"
            size="icon"
            title="Copiar URL"
            @click="copyUrl"
          >
            <CopyIcon class="size-4" />
          </Button>
        </div>

        <p class="text-sm text-muted-foreground">
          Atualize esta URL no painel do supplier — é o endereço chamado para
          reportar o status das mensagens.
        </p>

        <div class="flex items-center gap-2 pt-1">
          <Checkbox
            id="callback-url-saved"
            :checked="confirmedSaved"
            @update:checked="confirmedSaved = $event as boolean"
          />
          <Label
            for="callback-url-saved"
            class="text-sm font-normal cursor-pointer"
          >
            Copiei a URL e atualizei no painel do supplier
          </Label>
        </div>
      </div>

      <DialogFooter>
        <Button
          class="w-full"
          :disabled="!confirmedSaved"
          @click="emit('close')"
        >
          Concluir
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
