<script setup>
import { Minus } from 'lucide-vue-next'
import { Primitive, useForwardProps } from 'reka-ui';

const props = defineProps({
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
});
const forwardedProps = useForwardProps(props);
</script>

<template>
  <Primitive v-bind="forwardedProps">
    <slot>
      <Minus class="h-4 w-4" />
    </slot>
  </Primitive>
</template>
