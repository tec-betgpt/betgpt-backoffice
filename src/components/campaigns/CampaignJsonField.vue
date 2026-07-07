<template>
  <div class="space-y-2">
    <Label>{{ label }}</Label>
    <Textarea
      v-model="jsonValue"
      :disabled="readonly"
      :placeholder="placeholder"
      class="min-h-24 font-mono text-xs"
      @blur="commitJson"
    />
    <p v-if="jsonError" class="text-sm text-destructive">{{ jsonError }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const model = defineModel<Record<string, unknown> | null | undefined>({ required: true });

const props = withDefaults(
  defineProps<{
    label: string;
    readonly?: boolean;
    placeholder?: string;
  }>(),
  {
    readonly: false,
    placeholder: "{}",
  },
);

const jsonValue = ref("");
const jsonError = ref("");

watch(
  model,
  (value) => {
    jsonValue.value = value ? JSON.stringify(value, null, 2) : "";
    jsonError.value = "";
  },
  { immediate: true, deep: true },
);

const commitJson = () => {
  jsonError.value = "";

  if (!jsonValue.value.trim()) {
    model.value = null;
    return;
  }

  try {
    const parsed = JSON.parse(jsonValue.value);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      jsonError.value = "Informe um objeto JSON válido.";
      return;
    }
    model.value = parsed;
  } catch (_) {
    jsonError.value = "JSON inválido.";
  }
};
</script>
