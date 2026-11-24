<template>
  <div class="relative h-full min-h-[480px] w-full overflow-hidden rounded-md border bg-white">
    <div ref="host" class="h-full w-full" />
    <div
      v-if="status !== 'ready'"
      class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background text-sm text-muted-foreground"
    >
      <template v-if="status === 'error'">
        <span>{{ errorMessage }}</span>
        <Button type="button" variant="outline" size="sm" @click="mountEditor">Tentar novamente</Button>
      </template>
      <span v-else class="flex items-center gap-2"><Loader2 class="size-4 animate-spin" /> Carregando editor...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { Loader2 } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
  EMAIL_MERGE_TAGS,
  designFromHtml,
  loadUnlayer,
  type EmailBuilderContent,
  type EmailDesign,
  type UnlayerEditor,
} from "./unlayer";

const props = withDefaults(defineProps<{
  design?: EmailDesign | null;
  html?: string;
}>(), { design: null, html: "" });

const emit = defineEmits<{
  (event: "change", value: EmailBuilderContent): void;
}>();

const host = ref<HTMLElement | null>(null);
const status = ref<"loading" | "ready" | "error">("loading");
const errorMessage = ref("");
let editor: UnlayerEditor | null = null;

onMounted(mountEditor);
onBeforeUnmount(() => {
  editor?.destroy?.();
  editor = null;
  host.value?.replaceChildren();
});

async function mountEditor() {
  status.value = "loading";
  try {
    const unlayer = await loadUnlayer();
    if (!host.value) return;
    // O Unlayer controla esse nó; fica fora da árvore do Vue para não quebrar o unmount.
    const container = document.createElement("div");
    container.id = `email-builder-${Math.random().toString(36).slice(2, 10)}`;
    container.style.height = "100%";
    host.value.replaceChildren(container);
    editor = unlayer.createEditor({
      id: container.id,
      displayMode: "email",
      locale: "pt-BR",
      appearance: { theme: "modern_light", panels: { tools: { dock: "right" } } },
      mergeTags: EMAIL_MERGE_TAGS,
      features: { textEditor: { spellChecker: true } },
    });
    const initialDesign = props.design ?? (props.html.trim() ? designFromHtml(props.html) : null);
    editor.addEventListener(initialDesign ? "design:loaded" : "editor:ready", () => {
      status.value = "ready";
    });
    editor.addEventListener("design:updated", () => {
      editor?.exportHtml((data) => emit("change", data));
    });
    if (initialDesign) editor.loadDesign(initialDesign);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Não foi possível carregar o editor de e-mail.";
    status.value = "error";
  }
}

function exportContent(): Promise<EmailBuilderContent | null> {
  return new Promise((resolve) => {
    if (!editor || status.value !== "ready") return resolve(null);
    editor.exportHtml((data) => resolve(data));
  });
}

defineExpose({ exportContent });
</script>
