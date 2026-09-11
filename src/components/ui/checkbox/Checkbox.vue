<script setup lang="ts">
import type { CheckboxRootEmits, CheckboxRootProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-vue-next'
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'

type CheckedState = boolean | 'indeterminate'

const props = defineProps<CheckboxRootProps & {
  class?: HTMLAttributes['class']
  /** Alias do radix-vue (`:checked` / `v-model:checked`) usado em toda a aplicação. */
  checked?: CheckedState | null
}>()

const emit = defineEmits<CheckboxRootEmits & {
  'update:checked': [value: CheckedState]
}>()

const delegatedProps = computed(() => {
  const { class: _, checked, modelValue, ...delegated } = props

  return delegated
})

const model = computed(() => props.modelValue ?? props.checked)

function onUpdate(value: CheckedState) {
  emit('update:modelValue', value)
  emit('update:checked', value)
}
</script>

<template>
  <CheckboxRoot
    v-bind="delegatedProps"
    :model-value="model"
    :class="
      cn('peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
         props.class)"
    @update:model-value="onUpdate"
  >
    <CheckboxIndicator class="flex h-full w-full items-center justify-center text-current">
      <slot>
        <Check class="h-4 w-4" />
      </slot>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
