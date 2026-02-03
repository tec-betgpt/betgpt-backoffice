<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">
        Webhooks
      </h2>
      <p class="text-muted-foreground">
        Gerencie os webhooks do projeto.
      </p>
    </div>

    <div v-if="loading" class="space-y-4">
      <Skeleton class="h-6 w-full" />
      <Skeleton class="h-6 w-full" />
    </div>

    <div v-else class="grid md:grid-cols-1 lg:grid-cols-3 gap-4">
      <Card v-for="webhook in webhooks" :key="webhook.id" class="p-5">
        <div class="mb-5">
          <div class="h-14 w-14 rounded bg-gray-100 flex items-center justify-center">
             <!-- Placeholder logo since we don't have specific logos for webhooks yet -->
             <span class="text-xs font-bold text-gray-500 uppercase">{{ webhook.slug.substring(0, 2) }}</span>
          </div>
        </div>
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium">{{ webhook.name }}</p>
            <p class="mt-2 text-sm text-muted-foreground">
              {{ webhook.description }}
            </p>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-gray-100 flex justify-end">
             <Button variant="outline" size="sm" @click="openConfigureDialog(webhook)">Configurar</Button>
        </div>
      </Card>
    </div>

    <Dialog :open="isDialogOpen" @update:open="isDialogOpen = false">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurar Webhook</DialogTitle>
          <DialogDescription>
            Configure a URL para o webhook {{ selectedWebhook?.name }}.
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="webhook-url" class="text-right">
              URL
            </Label>
            <Input
              id="webhook-url"
              v-model="editingUrl"
              class="col-span-3"
              placeholder="https://sua-url-de-webhook.com"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isDialogOpen = false">Cancelar</Button>
          <Button type="submit" @click="saveWebhookUrl(selectedWebhook)">Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Webhooks from "@/services/webhooks";
import {useWorkspaceStore} from "@/stores/workspace";

const { toast } = useToast();
const loading = ref(false);
const webhooks = ref<Array<{ id: number; slug: string; name: string; description: string; webhook?: {webhook_url: string} }>>([]);
const isDialogOpen = ref(false);
const selectedWebhook = ref<any>(null);
const editingUrl = ref("");
const workspaceStore = useWorkspaceStore();
async function fetchWebhooks() {
  loading.value = true;
    try {
      //@ts-ignore
    const response = await Webhooks.index(workspaceStore.activeGroupProject.project_id)
      //console.log(response.data[0].webhook.webhook_url)
     webhooks.value = response.data.map((web: any) => ({
        ...web,
        webhook: {webhook_url: web.webhook.webhook_url}
     }))
  } catch (error) {
    console.error(error);
    toast({
      title: "Erro",
      description: "Erro ao carregar os webhooks.",
      variant: "destructive",
    });
  }

  loading.value = false;
}


function openConfigureDialog(webhook: any) {
  selectedWebhook.value = webhook;
  editingUrl.value = webhook.webhook.webhook_url || "";
  isDialogOpen.value = true;
}

async function saveWebhookUrl(webhook:any) {
  if (!editingUrl.value) return;

  const response = Webhooks.update(workspaceStore.activeGroupProject.project_id,{webhook_url:editingUrl.value,webhook_id:webhook.id});

  toast({
    title: "Sucesso",
    description: `URL do webhook ${selectedWebhook.value.name} atualizada com sucesso.`,
  });

  isDialogOpen.value = false;
}

onMounted(async () => {
  await fetchWebhooks();
});
</script>
