<template>
  <div class="" v-if="fields">
    <div class="space-y-1">
      <div v-for="(error, index) in fields" :key="index" class="p-3 rounded-md bg-red-600 text-white flex justify-between items-center">
        <div class="flex items-center">
          <TriangleAlertIcon class="w-5 mr-3" />
          <div> {{ error }} </div>
        </div>

        <Button size="icon" variant="ghost" @click="() => fields.splice(index, 1)">
          <X />
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, defineProps } from "vue";
import { TriangleAlertIcon, X } from 'lucide-vue-next'
const props = defineProps<{ errors: any }>();
const fields = ref<string[]>([]);

watch(() => props.errors, () => {
  fields.value = [];

  Object.entries(props.errors).forEach(([key, value]) => {
    return Array.isArray(value)
      ? fields.value.push(value.join(", "))
      : fields.value.push(value as string);
  });
})
</script>
