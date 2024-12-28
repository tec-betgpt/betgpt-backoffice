<script setup lang="ts">

import {ClipboardPaste} from "lucide-vue-next";
import {Button} from "@/components/ui/button";
import {useClipboard} from "@vueuse/core";
import {ref, watch} from "vue";
import { ClipboardCopy } from 'lucide-vue-next';

interface Props {
  variant: "Icon" | "Text";
}
const source = ref('')
const props = defineProps({
  clip: {
    type: Function,
    required: true,
  },
  variant: {
    type: String as () => "Icon" | "Text",
    required: true,
  },
  type:{
    type: String as () => "paste" | "copy",
    required:true
  }
});
const { copy,copied,text,isSupported}= useClipboard({source})
const pasteCode = async ()=>{
  const clip = await navigator.clipboard.readText();
   copy(clip)
}
const copyCode = async ()=>{
  await navigator.clipboard.writeText(props.clip())
}
watch(text,async ()=>{
  props.clip(text.value)
})

</script>

<template>
  <Button
      variant="outline"
      :size="props.variant === 'Icon' ? 'icon' : 'default'"
      class="h-11"
      @click="props.type === 'paste' ? pasteCode() : copyCode()"
  >
    <div v-if="props.variant === 'Icon'">
      <ClipboardPaste v-if="props.type === 'paste'" :size="18" />
      <ClipboardCopy v-if="props.type === 'copy'" :size="18" :stroke-width="1" absoluteStrokeWidth />
    </div>
    <div v-if="props.variant === 'Text'">
      <p v-if="props.type === 'paste'">{{ $t('paste') }}</p>
      <p v-if="props.type === 'copy'">{{ $t('copy') }}</p>
    </div>
  </Button>
</template>




<style scoped>

</style>