<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Editar Anotação</DialogTitle>
        <DialogDescription>
          Atualize as informações da anotação.
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label for="title">Título</Label>
          <Input
            id="title"
            v-model="form.title"
            placeholder="Digite o título da anotação..."
          />
        </div>
        <div class="grid gap-2">
          <Label for="annotation">Anotação (Opcional)</Label>
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
        <div class="flex items-center space-x-2">
          <Checkbox id="is_global" :checked="form.is_global" @update:checked="form.is_global = $event" />
          <Label for="is_global" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Tornar anotação global
          </Label>
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
import { ref, watch } from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import ProjectAnnotations from '@/services/projectAnnotations'
import { useToast } from '@/components/ui/toast/use-toast'

const props = defineProps<{
  open: boolean
  annotation: any
}>()

const emit = defineEmits(['update:open', 'saved'])

const { toast } = useToast()

const loading = ref(false)
const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#6b7280']
const form = ref({
  title: '',
  annotation: '',
  color: colors[0],
  is_global: false
})

watch(() => props.open, (newVal) => {
  if (newVal && props.annotation) {
    form.value.title = props.annotation.title || ''
    form.value.annotation = props.annotation.annotation || ''
    form.value.color = props.annotation.color || colors[0]
    form.value.is_global = !props.annotation.chart_name
  }
})

async function save() {
  if (!form.value.title) {
    toast({
      title: 'Erro',
      description: 'O título é obrigatório.',
      variant: 'destructive'
    })
    return
  }

  loading.value = true

  try {
    await ProjectAnnotations.update(props.annotation.id, {
      title: form.value.title,
      annotation: form.value.annotation || null,
      color: form.value.color,
      chart_name: form.value.is_global ? null : props.annotation.chart_name,
    })
    
    toast({
      title: 'Sucesso',
      description: 'Anotação atualizada com sucesso.'
    })
    emit('saved')
    emit('update:open', false)
  } catch (error) {
    console.error(error)
    toast({
      title: 'Erro',
      description: 'Não foi possível atualizar a anotação.',
      variant: 'destructive'
    })
  }

  loading.value = false
}
</script>
