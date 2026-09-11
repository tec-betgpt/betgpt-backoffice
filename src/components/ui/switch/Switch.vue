<script setup lang="ts">
import { cn } from '@/lib/utils'
import {
  SwitchRoot,
  type SwitchRootEmits,
  type SwitchRootProps,
  SwitchThumb,
} from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'

const props = defineProps<SwitchRootProps & {
  class?: HTMLAttributes['class']
  /** Alias do radix-vue (`:checked` / `v-model:checked`) usado em toda a aplicação. */
  checked?: boolean | null
}>()

const emit = defineEmits<SwitchRootEmits & {
  'update:checked': [payload: boolean]
}>()

const delegatedProps = computed(() => {
  const { class: _, checked, modelValue, ...delegated } = props

  return delegated
})

const model = computed(() => props.modelValue ?? props.checked)

function onUpdate(value: boolean) {
  emit('update:modelValue', value)
  emit('update:checked', value)
}
</script>

<template>
  <SwitchRoot
    v-bind="delegatedProps"
    :model-value="model"
    :class="cn(
      'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
      props.class,
    )"
    @update:model-value="onUpdate"
  >
    <SwitchThumb
      :class="cn('pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0')"
    >
      <slot name="thumb" />
    </SwitchThumb>
  </SwitchRoot>
</template>
