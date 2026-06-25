<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Novo Link</DialogTitle>
        <DialogDescription>
          Preencha os dados mínimos e complemente com destino, UTM e contexto.
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-6" @submit.prevent="submitForm()">
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label>Código *</Label>
            <Input v-model="form.code" placeholder="promo-junho" />
            <p v-if="fieldErrors.code" class="text-sm text-destructive">{{ fieldErrors.code }}</p>
          </div>

          <div class="space-y-2">
            <Label>Slug</Label>
            <Input v-model="form.slug" placeholder="minha-oferta" />
          </div>

          <div class="space-y-2">
            <Label>Status</Label>
            <Select v-model="form.status">
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="SELECT_NONE_VALUE">Sem definir</SelectItem>
                <SelectItem v-for="option in LINK_STATUS_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label>Tipo</Label>
            <Select v-model="form.type">
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="SELECT_NONE_VALUE">Sem definir</SelectItem>
                <SelectItem v-for="option in LINK_TYPE_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2 md:col-span-2">
            <Label>Fallback URL</Label>
            <Input v-model="form.fallback_url" placeholder="https://site.com/fallback" />
          </div>
        </div>

        <div class="space-y-4 rounded-lg border p-4">
          <div>
            <h3 class="font-medium">Destino</h3>
            <p class="text-sm text-muted-foreground">Alterar destino ou UTM pode gerar nova versão no backend.</p>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2 md:col-span-2">
              <Label>URL de destino *</Label>
              <Input v-model="form.destination.url" placeholder="https://site.com/oferta" />
              <p v-if="fieldErrors['destination.url']" class="text-sm text-destructive">{{ fieldErrors['destination.url'] }}</p>
            </div>

            <div class="space-y-2">
              <Label>Backup URL</Label>
              <Input v-model="form.destination.backup_url" placeholder="https://site.com/reserva" />
            </div>

            <div class="space-y-2">
              <Label>Status do destino</Label>
              <Select v-model="form.destination.status">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem :value="SELECT_NONE_VALUE">Sem definir</SelectItem>
                  <SelectItem v-for="option in LINK_DESTINATION_STATUS_OPTIONS" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label>Peso</Label>
              <Input v-model="form.destination.weight" type="number" min="0" placeholder="100" />
            </div>

            <div class="space-y-2">
              <Label>Variant key</Label>
              <Input v-model="form.destination.variant_key" placeholder="A" />
            </div>

            <div class="flex items-center justify-between rounded-md border p-3 md:col-span-2">
              <div>
                <p class="font-medium">Destino saudável</p>
                <p class="text-sm text-muted-foreground">Indica o estado informado para `is_healthy`.</p>
              </div>
              <Switch v-model:checked="form.destination.is_healthy" />
            </div>
          </div>
        </div>

        <div class="space-y-4 rounded-lg border p-4">
          <div>
            <h3 class="font-medium">UTM e contexto</h3>
            <p class="text-sm text-muted-foreground">Campos opcionais enviados na criação.</p>
          </div>

          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div class="space-y-2"><Label>UTM Source</Label><Input v-model="form.utm_source" /></div>
            <div class="space-y-2"><Label>UTM Medium</Label><Input v-model="form.utm_medium" /></div>
            <div class="space-y-2"><Label>UTM Campaign</Label><Input v-model="form.utm_campaign" /></div>
            <div class="space-y-2"><Label>UTM Term</Label><Input v-model="form.utm_term" /></div>
            <div class="space-y-2"><Label>UTM Content</Label><Input v-model="form.utm_content" /></div>
            <div class="space-y-2">
              <Label>Canal</Label>
              <Select v-model="form.channel">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem :value="SELECT_NONE_VALUE">Sem definir</SelectItem>
                  <SelectItem v-for="option in LINK_CHANNEL_OPTIONS" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2"><Label>Campaign UTM</Label><Input v-model="form.campaign_utm" /></div>
            <div class="space-y-2"><Label>Channel UTM</Label><Input v-model="form.channel_utm" /></div>
            <div class="space-y-2"><Label>Workspace UTM</Label><Input v-model="form.workspace_utm" /></div>
            <div class="space-y-2"><Label>Snapshot at</Label><Input v-model="form.snapshot_at" placeholder="2026-06-24T12:00:00Z" /></div>
            <div class="space-y-2"><Label>System fallback</Label><Input v-model="form.system_fallback" /></div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <Label>Reason</Label>
              <Textarea v-model="form.reason" rows="3" />
            </div>
            <div class="space-y-2">
              <Label>Contexto</Label>
              <Textarea v-model="form.context" rows="3" />
            </div>
          </div>

          <div class="flex items-center justify-between rounded-md border p-3">
            <div>
              <p class="font-medium">Preservar URL original</p>
              <p class="text-sm text-muted-foreground">Envia `preserve_original` quando ativado.</p>
            </div>
            <Switch v-model:checked="form.preserve_original" />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" @click="emit('update:open', false)">Cancelar</Button>
          <Button type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? "Salvando..." : "Criar link" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { toast } from "@/components/ui/toast";
import linksService from "@/services/links";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { LinkCreatePayload } from "@/contracts/link";
import {
  LINK_CHANNEL_OPTIONS,
  LINK_DESTINATION_STATUS_OPTIONS,
  LINK_STATUS_OPTIONS,
  LINK_TYPE_OPTIONS,
} from "@/contracts/link";
import {
  createDefaultForm,
  mapApiErrors,
  sanitizePayload,
  SELECT_NONE_VALUE,
  validateForm,
} from "@/components/links/linkForm";

const props = defineProps<{
  open: boolean;
  refreshList: (page?: number) => Promise<void> | void;
}>();

const emit = defineEmits<{
  (event: "update:open", value: boolean): void;
}>();

const form = reactive(createDefaultForm());
const isSubmitting = ref(false);
const fieldErrors = ref<Record<string, string>>({});

function resetForm() {
  Object.assign(form, createDefaultForm());
  fieldErrors.value = {};
}

async function submitForm() {
  const errors = validateForm(form);
  fieldErrors.value = errors;

  if (Object.keys(errors).length > 0) {
    return;
  }

  isSubmitting.value = true;
  fieldErrors.value = {};

  try {
    await linksService.store(sanitizePayload(form) as LinkCreatePayload);
    toast({ title: "Link criado com sucesso!" });
    emit("update:open", false);
    await props.refreshList(1);
    resetForm();
  } catch (error: any) {
    fieldErrors.value = mapApiErrors(error);

    if (error?.response?.status === 403) {
      toast({
        title: "Acesso negado",
        description: error.response?.data?.message || "Você não tem acesso a esse projeto ou link.",
        variant: "destructive",
      });
    }
  } finally {
    isSubmitting.value = false;
  }
}

watch(
  () => props.open,
  (value) => {
    if (value) {
      resetForm();
    }
  },
);
</script>