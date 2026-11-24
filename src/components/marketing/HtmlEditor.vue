<template>
  <Editor
    :model-value="modelValue"
    :disabled="disabled"
    :init="editorOptions"
    @update:modelValue="emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";

const Editor = defineAsyncComponent(async () => {
  // Os plugins dependem do global `tinymce`, então o core precisa carregar antes.
  await import("tinymce/tinymce");
  await Promise.all([
    import("tinymce/skins/ui/oxide/skin.js"),
    import("tinymce/skins/ui/oxide/content.js"),
    import("tinymce/skins/content/default/content.js"),
    import("tinymce/themes/silver"),
    import("tinymce/icons/default"),
    import("tinymce/models/dom"),
    import("tinymce/plugins/advlist"),
    import("tinymce/plugins/autolink"),
    import("tinymce/plugins/autoresize"),
    import("tinymce/plugins/code"),
    import("tinymce/plugins/image"),
    import("tinymce/plugins/link"),
    import("tinymce/plugins/lists"),
    import("tinymce/plugins/table"),
  ]);

  return (await import("@tinymce/tinymce-vue")).default;
});

withDefaults(defineProps<{
  modelValue: string;
  disabled?: boolean;
}>(), { disabled: false });

const emit = defineEmits<{ (event: "update:modelValue", value: string): void }>();
const editorOptions = {
  license_key: "gpl",
  skin_url: "default",
  content_css: "default",
  menubar: false,
  branding: false,
  promotion: false,
  height: 420,
  resize: false,
  browser_spellcheck: true,
  plugins: ["advlist", "autolink", "autoresize", "code", "image", "link", "lists", "table"],
  toolbar: "undo redo | blocks | bold italic underline | bullist numlist | link image | table | code",
  content_style: "body { font-family: Inter, Arial, sans-serif; font-size: 14px; padding: 12px; }",
};
</script>
