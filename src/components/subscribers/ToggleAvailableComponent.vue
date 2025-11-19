<template>
  <div class="flex items-center">
    <Spinner v-if="isLoading" class="h-4 w-4 animate-spin" />
    <Switch v-else v-model="isAvailable" @update:model-value="onSubmit" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useToast} from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import Users from "@/services/users";

const props = defineProps<{
  row: any,
  reload: () => Promise<void>
}>();

const { toast } = useToast();

const isLoading = ref(false);
const isAvailable = ref(false);

const onSubmit = async () => {
  isLoading.value = true

  try {
    await Users.toggleAvailable(props.row.id, { is_available: isAvailable.value })
    await props.reload();

    toast({
      title: "Sucesso",
      description: "Autorização de uso atualizada.",
    });
  } catch (error: any) {
    toast({
      title: "Ops!",
      description: error.response.data.message,
      duration: 3000,
      variant: "destructive",
    });
  }

  isLoading.value = false;
}

onMounted(() => {
  isAvailable.value = Boolean(props.row.is_available)
})
</script>
