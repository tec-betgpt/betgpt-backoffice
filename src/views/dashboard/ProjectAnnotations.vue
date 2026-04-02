<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">Marcos</h2>
        <p class="text-muted-foreground">
          Gerencie todas suas anotações/marcos adicionadas aos gráficos deste projeto
        </p>
      </div>
    </div>

    <Card>
      <CardContent class="pt-6">
        <Table class="w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead v-if="activeGroupProjectType == 'group'">Projeto</TableHead>
              <TableHead>Recurso</TableHead>
              <TableHead>Gráfico</TableHead>
              <TableHead>Cor</TableHead>
              <TableHead>Data Início</TableHead>
              <TableHead>Data Fim</TableHead>
              <TableHead class="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="isLoading" v-for="row in 5" :key="row">
              <TableCell v-for="col in 7" :key="col">
                <Skeleton class="h-4 w-full bg-gray-300 my-2" />
              </TableCell>
            </TableRow>
            <template v-else>
              <TableRow v-for="annotation in projectAnnotations" :key="annotation.id">
                <TableCell class="font-medium">{{ annotation.title }}</TableCell>
                <TableCell>{{ annotation.project.name }}</TableCell>
                <TableCell>{{ annotation.resource || "N/A" }}</TableCell>
                <TableCell>{{ annotation.chart_name || "Global" }}</TableCell>
                <TableCell>
                  <div
                    v-if="annotation.color"
                    class="w-4 h-4 rounded-full border"
                    :style="{ backgroundColor: annotation.color }">
                  </div>
                </TableCell>
                <TableCell>{{ formatDate(annotation.date) }}</TableCell>
                <TableCell>{{ formatDate(annotation.date_end) }}</TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      @click="viewAnnotation(annotation)"
                    >
                      <Eye class="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      @click="editAnnotation(annotation)"
                    >
                      <Pencil class="h-4 w-4" />
                    </Button>
                    <DestroyDialogComponent
                      :row="annotation"
                      :destroy="deleteAnnotation"
                      :reload="fetchProjectAnnotations"
                    />
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-if="projectAnnotations.length === 0">
                <TableCell colspan="7" class="text-center py-10 text-muted-foreground">
                  Nenhuma anotação encontrada.
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <div class="mt-4">
      <CustomSimplePagination
        :current-page="pages.current"
        :per-page="perPage"
        @page-changed="fetchProjectAnnotations"
        @update:per-page="(val) => perPage = val"
      />
    </div>

    <AnnotationDetailsDialog
      v-model:open="isDetailsOpen"
      :annotation="selectedAnnotation"
    />

    <AnnotationEditDialog
      v-model:open="isEditOpen"
      :annotation="selectedAnnotation"
      @saved="fetchProjectAnnotations(pages.current)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import ProjectAnnotations from "@/services/projectAnnotations";
import { useWorkspaceStore } from "@/stores/workspace";
import CustomSimplePagination from "@/components/custom/CustomSimplePagination.vue";
import DestroyDialogComponent from "@/components/custom/DestroyDialogComponent.vue";
import AnnotationDetailsDialog from "@/components/project_annotations/AnnotationDetailsDialog.vue";
import AnnotationEditDialog from "@/components/project_annotations/AnnotationEditDialog.vue";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Eye, Pencil } from "lucide-vue-next";
import moment from "moment";
import { ProjectAnnotation } from "@/contracts/projectAnnotation";

const { toast } = useToast();
const isLoading = ref(true);
const projectAnnotations = ref<ProjectAnnotation[]>([]);
const pages = ref({
  current: 1,
  last: 0,
  total: 0,
});
const selectedRange = ref();
const perPage = ref(15);
const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject!.id;
const activeGroupProjectType = workspaceStore.activeGroupProject!.type;
const isDetailsOpen = ref(false);
const isEditOpen = ref(false);
const selectedAnnotation = ref(null);

const fetchProjectAnnotations = async (current = 1) => {
  isLoading.value = true;

  try {
    const params: any = {
      page: current,
      filter_id: activeGroupProjectId,
      per_page: perPage.value,
    };

    const response = await ProjectAnnotations.all(params);

    projectAnnotations.value = response.data;
    pages.value = {
      current: response.current_page,
      last: response.last_page,
      total: response.total,
    };
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao carregar os dados.",
      variant: "destructive",
    });
  }

  isLoading.value = false;
};

const deleteAnnotation = async (id: number) => {
  try {
    await ProjectAnnotations.destroy(id);
    toast({
      title: "Sucesso",
      description: "Anotação removida com sucesso.",
    });
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao remover a anotação.",
      variant: "destructive",
    });
    throw error;
  }
};

const viewAnnotation = (annotation: any) => {
  selectedAnnotation.value = annotation;
  isDetailsOpen.value = true;
};

const editAnnotation = (annotation: any) => {
  selectedAnnotation.value = annotation;
  isEditOpen.value = true;
};

const formatDate = (date: string | null) => {
  if (!date) return "N/A";
  return moment(date).format("DD/MM/YYYY");
};

watch(perPage, () => fetchProjectAnnotations(1));
watch(selectedRange, () => fetchProjectAnnotations(1));

onMounted(fetchProjectAnnotations);
</script>
