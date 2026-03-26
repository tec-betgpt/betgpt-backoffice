<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Detalhes da Anotação</DialogTitle>
        <DialogDescription>
          Visualize as informações detalhadas desta anotação.
        </DialogDescription>
      </DialogHeader>
      
      <div v-if="annotation" class="grid gap-4 py-4">
        <div class="flex items-center gap-3">
          <div 
            class="w-4 h-4 rounded-full border" 
            :style="{ backgroundColor: annotation.color }"
          />
          <h3 class="text-lg font-semibold">{{ annotation.title }}</h3>
        </div>

        <div class="grid grid-cols-2 gap-4 text-sm">
          <div class="space-y-1">
            <p class="text-muted-foreground font-medium">Data de Início</p>
            <p>{{ formatDate(annotation.date) }}</p>
          </div>
          <div v-if="annotation.date_end" class="space-y-1">
            <p class="text-muted-foreground font-medium">Data de Término</p>
            <p>{{ formatDate(annotation.date_end) }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-muted-foreground font-medium">Recurso</p>
            <p>{{ annotation.resource || 'N/A' }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-muted-foreground font-medium">Gráfico</p>
            <p>{{ annotation.chart_name || 'Global' }}</p>
          </div>
        </div>

        <div v-if="annotation.annotation" class="space-y-2">
          <p class="text-sm text-muted-foreground font-medium">Descrição</p>
          <div class="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
            {{ annotation.annotation }}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 text-xs text-muted-foreground pt-2 border-t">
          <p>Criado em: {{ formatDateTime(annotation.created_at) }}</p>
          <p>Atualizado em: {{ formatDateTime(annotation.updated_at) }}</p>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" @click="$emit('update:open', false)">
          Fechar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import moment from "moment";

defineProps<{
  open: boolean;
  annotation: any;
}>();

defineEmits(["update:open"]);

const formatDate = (date: string) => {
  if (!date) return "N/A";
  return moment(date).format("DD/MM/YYYY");
};

const formatDateTime = (date: string) => {
  if (!date) return "N/A";
  return moment(date).format("DD/MM/YYYY HH:mm");
};
</script>
