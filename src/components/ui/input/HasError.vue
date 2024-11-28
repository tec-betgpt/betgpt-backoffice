<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  field: {
    type: String,
    required: true,
  },
});

const errorMessage = computed(() => props.form.errors.get(props.field));
</script>

<template>
  <p
    v-if="errorMessage"
    role="alert"
    class="text-sm font-medium text-destructive mt-2"
  >
    {{ errorMessage }}
  </p>
</template>
