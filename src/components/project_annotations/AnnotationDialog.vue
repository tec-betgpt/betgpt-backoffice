<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Adicionar Anotação</DialogTitle>
        <DialogDescription>
          Adicione uma anotação para {{ isRange ? `o período de ${date} até ${endDate}` : `a data ${date}` }}.
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label for="annotation">Anotação</Label>
          <Textarea
            id="annotation"
            v-model="form.annotation"
            placeholder="Digite sua anotação aqui..."
          />
        </div>
        <div class="grid gap-2">
          <Label for="color">Cor</Label>
          <div class="flex gap-2">
            <button
              v-for="c in colors"
              :key="c"
              type="button"
              :style="{ backgroundColor: c }"
              class="w-6 h-6 rounded-full border-2"
              :class="form.color === c ? 'border-primary' : 'border-transparent'"
              @click="form.color = c"
            />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" @click="$emit('update:open', false)">
          Cancelar
        </Button>
        <Button type="button" :disabled="loading" @click="save">
          {{ loading ? 'Salvando...' : 'Salvar' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import projectAnnotations from '@/services/projectAnnotations'
import { useWorkspaceStore } from '@/stores/workspace'
import { useToast } from '@/components/ui/toast/use-toast'
import moment from "moment";

const props = defineProps<{
  open: boolean
  date: string
  endDate?: string
  chartName: string
}>()

const emit = defineEmits(['update:open', 'saved'])

const workspaceStore = useWorkspaceStore()
const { toast } = useToast()

const loading = ref(false)
const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#6b7280']
const form = ref({
  annotation: '',
  color: colors[0]
})

const isRange = computed(() => !!props.endDate && props.endDate !== props.date)

watch(() => props.open, (newVal) => {
  if (newVal) {
    form.value.annotation = ''
  }
})

async function save() {
  if (!form.value.annotation) {
    toast({
      title: 'Erro',
      description: 'A anotação não pode estar vazia.',
      variant: 'destructive'
    })
    return
  }

  loading.value = true

  try {
    // Se for um range, podemos concatenar no texto ou se o back suportar, enviar campos extras.
    // Como a estrutura informada só tem 'date', usaremos a data inicial.
    const annotationText = isRange.value
      ? `[Período: ${props.date} a ${props.endDate}] ${form.value.annotation}`
      : form.value.annotation

    await projectAnnotations.store({
      project_id: workspaceStore.activeGroupProject?.id,
      chart_name: props.chartName,
      annotation: annotationText,
      color: form.value.color,
      date: moment(props.date, 'DD/MM/YYYY').format('YYYY-MM-DD')
    })
    toast({
      title: 'Sucesso',
      description: 'Anotação salva com sucesso.'
    })
    emit('saved')
    emit('update:open', false)
  } catch (error) {
    console.error(error)
    toast({
      title: 'Erro',
      description: 'Não foi possível salvar a anotação.',
      variant: 'destructive'
    })
  }

  loading.value = false
}
</script>
