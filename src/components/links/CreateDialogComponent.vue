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
            <h3 class="font-medium">Destinos</h3>
            <p class="text-sm text-muted-foreground">Até 3 destinos com pesos somando 100.</p>
          </div>

          <div v-for="(dest, i) in form.destinations" :key="i" class="rounded-lg border p-4 space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="font-medium">Destino {{ i + 1 }}</h4>
              <Button
                v-if="form.destinations.length > 1"
                type="button"
                variant="ghost"
                size="sm"
                @click="removeDestination(form.destinations, i)"
              >
                Remover
              </Button>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2 md:col-span-2">
                <Label>URL de destino *</Label>
                <Input v-model="dest.url" placeholder="https://site.com/oferta" />
              </div>
              <div class="space-y-2">
                <Label>Peso</Label>
                <Input v-model="dest.weight" type="number" min="0" placeholder="100" />
              </div>
              <div class="space-y-2">
                <Label>Variant key</Label>
                <Input v-model="dest.variant_key" placeholder="A" />
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <Button
              v-if="form.destinations.length < MAX_DESTINATIONS"
              type="button"
              variant="outline"
              size="sm"
              @click="addDestination(form.destinations)"
            >
              + Adicionar destino
            </Button>
            <span :class="['text-sm font-medium', totalWeight === 100 ? 'text-green-600' : 'text-destructive']">
              Peso total: {{ totalWeight }} / 100
            </span>
          </div>
          <p v-if="fieldErrors['destinations.weight']" class="text-sm text-destructive">{{ fieldErrors['destinations.weight'] }}</p>
        </div>

        <div class="space-y-4 rounded-lg border p-4">
          <div>
            <h3 class="font-medium">UTM e contexto</h3>
            <p class="text-sm text-muted-foreground">Campos opcionais enviados na criação.</p>
          </div>

          <div class="space-y-4">
            <Collapsible v-slot="{ open }">
              <div class="rounded-lg border">
                <CollapsibleTrigger class="flex w-full items-center justify-between p-4 text-sm font-medium hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180">
                  UTM
                  <ChevronDown class="h-4 w-4 transition-transform duration-200" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3 px-4 pb-4">
                    <div class="space-y-2"><Label>Source</Label><Input v-model="form.utm.utm_source" /></div>
                    <div class="space-y-2"><Label>Medium</Label><Input v-model="form.utm.utm_medium" /></div>
                    <div class="space-y-2"><Label>Campaign</Label><Input v-model="form.utm.utm_campaign" /></div>
                    <div class="space-y-2"><Label>Term</Label><Input v-model="form.utm.utm_term" /></div>
                    <div class="space-y-2"><Label>Content</Label><Input v-model="form.utm.utm_content" /></div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

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
import { computed, reactive, ref, watch } from "vue";
import { toast } from "@/components/ui/toast";
import linksService from "@/services/links";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { ChevronDown } from "lucide-vue-next";
import type { LinkCreatePayload } from "@/contracts/link";
import {
  LINK_CHANNEL_OPTIONS,
  LINK_STATUS_OPTIONS,
  LINK_TYPE_OPTIONS,
} from "@/contracts/link";
import {
  addDestination,
  createDefaultForm,
  mapApiErrors,
  MAX_DESTINATIONS,
  removeDestination,
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

const totalWeight = computed(() =>
  form.destinations.reduce((sum, d) => sum + (Number(d.weight) || 0), 0),
);

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
    await linksService.store(sanitizePayload(form) as unknown as LinkCreatePayload);
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