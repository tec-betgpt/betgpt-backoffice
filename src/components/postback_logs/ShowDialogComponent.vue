<template>
  <Button size="icon" variant="ghost" @click="open()">
    <Eye />
  </Button>

  <Dialog v-model:open="dialog" @update:open="dialog = false">
    <DialogContent class="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Payload do Postback</DialogTitle>
        <DialogDescription>
          Detalhes completos do postback recebido
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div
          v-if="selectedPayload?.error"
          class="bg-red-50 p-4 rounded-md border border-red-200"
        >
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-medium text-red-800">
                Erro no processamento
              </h3>
              <div class="mt-2 text-sm text-red-700">
                {{ selectedPayload.error }}
              </div>
            </div>
          </div>
        </div>

        <div
          class="bg-gray-100 dark:bg-gray-800 p-4 rounded-md max-h-[60vh] overflow-y-auto"
        >
            <pre
              class="text-sm text-gray-900 dark:text-gray-100 font-mono whitespace-pre-wrap break-all"
            >{{ formattedPayload }}</pre
            >
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
<script setup lang="ts">
import {Eye} from "lucide-vue-next";
import {computed, defineProps, ref} from "vue";
import PostbackLogService from "@/services/postbackLog";
import {useToast} from "@/components/ui/toast";

const { toast } = useToast();

const props = defineProps<{ row: any }>()
const dialog = ref(false);
const isPayloadModalOpen = ref(false);
const selectedPayload = ref<any>(null);
const formattedPayload = computed(() => {
  return selectedPayload.value
    ? JSON.stringify(selectedPayload.value, null, 2)
    : "Nenhum payload selecionado";
});

const open = async () => {
  await show(props.row.id);
  dialog.value = true;
};

const show = async (logId: number) => {
  try {
    const { data } = await PostbackLogService.payload(logId);
    selectedPayload.value = data.payload;
    isPayloadModalOpen.value = true;
  } catch (error) {
    toast({
      title: "Erro ao carregar payload",
      description: "Não foi possível carregar o payload do postback.",
      variant: "destructive",
    });
  }
};
</script>
