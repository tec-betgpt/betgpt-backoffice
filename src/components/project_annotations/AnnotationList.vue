<template>
  <div class="mt-4 space-y-2">
    <h4 class="text-sm font-medium">Anotações</h4>
    <div v-if="loading" class="space-y-2">
      <Skeleton class="h-10 w-full" />
      <Skeleton class="h-10 w-full" />
    </div>
    <div v-else-if="annotations.length === 0" class="text-xs text-muted-foreground">
      Nenhuma anotação para este gráfico.
    </div>
    <div v-else class="space-y-2">
      <div
        v-for="annotation in annotations"
        :key="annotation.id"
        class="flex items-start gap-2 p-2 rounded-md text-wrap border text-xs"
        :style="{ borderLeftColor: annotation.color, borderLeftWidth: '4px' }"
      >
        <div class="flex-1">
          <div class="flex justify-between items-center mb-1">
            <span class="font-semibold">{{ formatDate(annotation.date) }}</span>
            <Button
              variant="ghost"
              size="icon"
              class="h-4 w-4 text-destructive"
              @click="deleteAnnotation(annotation.id)"
            >
              <Trash2 class="h-3 w-3" />
            </Button>
          </div>
          <p class="text-muted-foreground">{{ annotation.annotation }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import projectAnnotations from '@/services/projectAnnotations'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Trash2 } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'
import moment from 'moment'

const props = defineProps<{
  chartName: string
  projectId: string
}>()

const annotations = ref<any[]>([])
const loading = ref(false)
const { toast } = useToast()

async function fetchAnnotations() {
  if (!props.projectId || !props.chartName) return

  loading.value = true

  try {
    const response = await projectAnnotations.index({
      filter_id: props.projectId,
      chart_name: props.chartName,
      perPage: 100
    })
    annotations.value = response || []
  } catch (error) {
    console.error(error)
  }

  loading.value = false
}

async function deleteAnnotation(id: number) {
  try {
    await projectAnnotations.destroy(id)
    toast({
      title: 'Sucesso',
      description: 'Anotação removida com sucesso.'
    })
    fetchAnnotations()
  } catch (error) {
    toast({
      title: 'Erro',
      description: 'Não foi possível remover a anotação.',
      variant: 'destructive'
    })
  }
}

function formatDate(date: string) {
  return moment(date).format('DD/MM/YYYY')
}

watch(() => props.chartName, fetchAnnotations)
watch(() => props.projectId, fetchAnnotations)

onMounted(fetchAnnotations)

defineExpose({
  refresh: fetchAnnotations
})
</script>
