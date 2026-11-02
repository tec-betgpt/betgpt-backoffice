<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { Check, Copy } from "lucide-vue-next";
import { toast } from "vue-sonner";

const props = defineProps<{
  value?: string | null;
  label?: string;
}>();

const copied = ref(false);
let copiedTimer: number | null = null;

async function copyValue() {
  if (!props.value) return;

  try {
    await navigator.clipboard.writeText(props.value);
    copied.value = true;
    toast("Copiado!", {
      description: `${props.label ?? "Valor"} copiado para a área de transferência.`,
    });

    if (copiedTimer !== null) {
      window.clearTimeout(copiedTimer);
    }
    copiedTimer = window.setTimeout(() => {
      copied.value = false;
      copiedTimer = null;
    }, 1500);
  } catch {
    toast.error("Não foi possível copiar", {
      description: "Seu navegador bloqueou o acesso à área de transferência.",
    });
  }
}

onBeforeUnmount(() => {
  if (copiedTimer !== null) {
    window.clearTimeout(copiedTimer);
  }
});
</script>

<template>
  <button
    type="button"
    class="group flex w-full min-w-0 cursor-pointer items-center gap-2 text-left disabled:cursor-default"
    :class="value ? 'hover:text-foreground' : ''"
    :disabled="!value"
    :title="value ? `Copiar ${label ?? 'valor'}` : ''"
    @click.stop="copyValue"
  >
    <slot>{{ value || "—" }}</slot>
    <Check v-if="copied" class="h-3.5 w-3.5 shrink-0 text-emerald-500" />
    <Copy
      v-else-if="value"
      class="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-60"
    />
  </button>
</template>
