<template>
  <div class="flex items-center">
    <Spinner v-if="isLoading" class="h-4 w-4 animate-spin" />
    <Switch v-else v-model="isActive" @update:model-value="onSubmit" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { toast } from "vue-sonner";
import Services from "@/services/services";
import {Spinner} from "@/components/ui/spinner";

const props = defineProps<{
  row: any,
  reload: () => Promise<void>
}>();


const isLoading = ref(false);
const isActive = ref(false);

const onSubmit = async () => {
  isLoading.value = true

  try {
    await Services.toggle(props.row.id, { is_active: isActive.value })
    await props.reload();

    toast("Sucesso", { description: "Disponibilidade atualizado com sucesso." });
  } catch (error: any) {
    toast.error("Ops!", { description: error.response.data.message, duration: 3000 });
  }

  isLoading.value = false;
}

onMounted(() => {
  isActive.value = Boolean(props.row.is_active)
})
</script>
