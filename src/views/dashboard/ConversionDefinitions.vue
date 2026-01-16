<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid gap-4 md:grid-cols-2 sm:grid-cols-1 mb-10">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">
          Gerenciar Definições de Conversão
        </h2>
        <p class="text-muted-foreground">
          Crie e gerencie definições de conversão com regras personalizadas.
        </p>
      </div>
      <div class="flex flex-col justify-end sm:flex-row gap-2 w-full">
        <CreateDialogComponent :reload="fetchConversionDefinitions" />
      </div>
    </div>

    <Card>
      <CardHeader>
        <div class="flex justify-between items-center flex-nowrap">
          <CardTitle>Definições de Conversão</CardTitle>

          <Select v-model="conversionType">
            <SelectTrigger class="w-[180px]">
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary"> Primárias </SelectItem>
              <SelectItem value="quantitative"> Quantitativas </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent class="py-4">
        <Table class="w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Conversão</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead class="text-right">Registrar no Retorno</TableHead>
              <TableHead class="text-right">Editado pela última vez</TableHead>
              <TableHead class="text-right">Eventos</TableHead>
              <TableHead class="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <template v-if="isLoading">
              <TableRow v-for="i in 5" :key="i">
                <TableCell v-for="j in 6" :key="j">
                  <SkeletonCustom class="h-6 w-full" />
                </TableCell>
              </TableRow>
            </template>
            <template v-else>
              <TableRow
                v-for="(row, index) in conversionDefinitions"
                :key="row.id"
                :style="`--delay: ${getMs(index)}`"
              >
                <TableCell>
                  {{ row.name }}
                </TableCell>
                <TableCell>
                  {{ row.conversion_category }}
                </TableCell>
                <TableCell>
                  {{ row.is_primary ? "Primária" : "Quantitativa" }}
                </TableCell>
                <TableCell class="text-right">
                  {{ row.is_return_report ? "Sim" : "Não" }}
                </TableCell>
                <TableCell class="text-right">
                  {{ formatDate(row.updated_at) }}h
                </TableCell>
                <TableCell class="text-right">
                  {{ row.events }}
                </TableCell>
                <TableCell>
                  <div class="flex flex-nowrap justify-end">
                    <EditDialogComponent
                      :row="row"
                      :reload="fetchConversionDefinitions"
                    />
                    <DestroyDialogComponent
                      :reload="fetchConversionDefinitions"
                      :row="row"
                      :destroy="destroy"
                    />
                  </div>
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { useWorkspaceStore } from "@/stores/workspace";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { getMs } from "@/filters/formatNumbers";
import CreateDialogComponent from "@/components/conversion_definitions/CreateDialogComponent.vue";
import EditDialogComponent from "@/components/conversion_definitions/EditDialogComponent.vue";
import ConversionDefinitions from "@/services/conversionDefinitions";
import DestroyDialogComponent from "@/components/custom/DestroyDialogComponent.vue";
import SkeletonCustom from "@/components/custom/SkeletonCustom.vue";

const { toast } = useToast();
const isLoading = ref(false);
const conversionType = ref("primary");
const workspaceStore = useWorkspaceStore();
const conversionDefinitions = ref<any[]>([]);

const activeGroupProject = computed(
  () => workspaceStore.activeGroupProject || null
);

const fetchConversionDefinitions = async () => {
  isLoading.value = true;
  try {
    conversionDefinitions.value = await ConversionDefinitions.index({
      filter_id: activeGroupProject.value.id,
    });
  } catch (error) {
    console.error("Error loading conversion definitions:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar as definições de conversão",
      variant: "destructive",
    });
  }

  isLoading.value = false;
};

const destroy = async (id: number) => {
  isLoading.value = true;

  try {
    await ConversionDefinitions.destroy(id);
    await fetchConversionDefinitions();

    toast({
      title: "Sucesso",
      description: "Definição de conversão removida com sucesso",
    });
  } catch (_) {
    toast({
      title: "Erro",
      description: "Não foi possível remover a definição de conversão",
      variant: "destructive",
    });
  }

  isLoading.value = false;
};

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString("pt-BR", options);
};

onMounted(async () => {
  await fetchConversionDefinitions();
});
</script>
