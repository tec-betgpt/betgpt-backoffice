<script setup lang="ts">
import { ref, computed } from "vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { useToast } from "@/components/ui/toast/use-toast";
import Segments from "@/services/segments";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2Icon } from "lucide-vue-next";

const props = defineProps<{
  segmentIds: number[];
}>();

const emit = defineEmits(["exported"]);

const open = ref(false);
const isExporting = ref(false);
const selectProjects = ref<number[]>([]);

const workspaceStore = useWorkspaceStore();
const { toast } = useToast();

const activeGroupProjectId = computed(() => workspaceStore.activeGroupProject?.id);

const listGroupProject = computed(() =>
  workspaceStore.group_projects.filter(
    (project) => project.id !== activeGroupProjectId.value
  )
);

const handleOpen = () => {
  selectProjects.value = [];
  open.value = true;
};

const exportSegment = async () => {
  if (!activeGroupProjectId.value) return;

  try {
    isExporting.value = true;
    await Segments.export({
      project_id: activeGroupProjectId.value,
      segment_ids: props.segmentIds,
      target_project_ids: selectProjects.value,
    });

    toast({
      title: "Exportação iniciada",
      description: "Exportação do Segmento em andamento...",
      variant: "default",
    });

    open.value = false;
    emit("exported");

    toast({
      title: "Sucesso",
      description: "Segmento exportado com sucesso",
      variant: "default",
    });
  } catch (error) {
    console.error("Error exporting segment:", error);
    toast({
      title: "Erro",
      description: "Não foi possível exportar o segmento",
      variant: "destructive",
    });
  } finally {
    isExporting.value = false;
  }
};

defineExpose({
  open: handleOpen,
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Exportar Segmentos</DialogTitle>
        <DialogDescription>
          Escolha para quais projetos deseja exportar os segmentos selecionados.
        </DialogDescription>
      </DialogHeader>

      <div class="py-4 space-y-4">
        <div
          v-if="listGroupProject.length === 0"
          class="text-sm text-muted-foreground"
        >
          Não há outros projetos disponíveis para exportação.
        </div>
        <div v-else class="max-h-[300px] overflow-y-auto space-y-2 pr-2">
          <div
            v-for="project in listGroupProject"
            :key="project.id"
            class="flex items-center space-x-2"
          >
            <Checkbox
              :id="'project-' + project.id"
              :checked="selectProjects.includes(project.id)"
              @update:checked="
                (checked) => {
                  if (checked) {
                    selectProjects.push(project.id);
                  } else {
                    selectProjects = selectProjects.filter(
                      (id) => id !== project.id
                    );
                  }
                }
              "
            />
            <Label :for="'project-' + project.id" class="cursor-pointer">
              {{ project.name }}
            </Label>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="secondary" @click="open = false"> Cancelar </Button>
        <Button
          :disabled="!selectProjects.length || isExporting"
          @click="exportSegment"
        >
          <Loader2Icon v-if="isExporting" class="mr-2 h-4 w-4 animate-spin" />
          Exportar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
