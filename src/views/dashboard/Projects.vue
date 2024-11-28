<template>
  <div class="space-y-6 p-10 pb-16">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Gerenciar Projetos</h2>
      <p class="text-muted-foreground">
        Gerencie seus projetos, altere status e edite informações.
      </p>
    </div>
    <Card>
      <CardContent>
        <div v-if="isLoading" class="mt-6">
          <div class="space-y-4">
            <Skeleton class="h-6 w-full" />
            <Skeleton class="h-6 w-full" />
            <Skeleton class="h-6 w-full" />
          </div>
        </div>

        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Data Criação</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="project in projects" :key="project.id">
              <TableCell class="font-medium">{{ project.id }}</TableCell>
              <TableCell class="font-medium">{{ project.name }}</TableCell>
              <TableCell class="font-medium">
                {{ $moment(project.created_at).format("DD/MM/YYYY HH:mm:ss") }}
              </TableCell>
              <TableCell>
                <div class="flex items-center">
                  <LucideSpinner
                    v-if="processingStatusId === project.id"
                    class="mr-2 h-4 w-4 animate-spin"
                  />
                  <Badge
                    v-else
                    :variant="
                      getStatus(project) === 'active'
                        ? 'success'
                        : 'destructive'
                    "
                  >
                    {{ getStatus(project) === "active" ? "Ativo" : "Inativo" }}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button
                      aria-haspopup="true"
                      size="icon"
                      variant="ghost"
                      :disabled="isProcessing"
                    >
                      <MoreHorizontal class="h-4 w-4" />
                      <span class="sr-only">Ações</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="openEditModal(project)">
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      @mousedown="toggleStatus(project)"
                      :disabled="processingAction === `status-${project.id}`"
                    >
                      <div class="flex items-center">
                        <LucideSpinner
                          v-if="processingAction === `status-${project.id}`"
                          class="mr-2 h-4 w-4 animate-spin"
                        />
                        {{
                          processingAction === `status-${project.id}`
                            ? getStatus(project) === "active"
                              ? "Desativando..."
                              : "Ativando..."
                            : getStatus(project) === "active"
                            ? "Inativar"
                            : "Ativar"
                        }}
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <Button @click="openCreateModal">
          {{ isProcessing ? "Carregando..." : "Novo Projeto" }}
        </Button>
      </CardFooter>
    </Card>

    <Sheet v-model:open="showModal">
      <SheetContent position="right" size="lg">
        <SheetHeader>
          <SheetTitle>
            {{ isEditing ? "Editar Projeto" : "Novo Projeto" }}
          </SheetTitle>
          <SheetDescription>
            {{
              isEditing
                ? "Edite as informações do projeto"
                : "Crie um novo projeto"
            }}
          </SheetDescription>
        </SheetHeader>
        <form @submit.prevent="isEditing ? updateProject() : createProject()">
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="name">Nome do Projeto</Label>
              <Input
                id="name"
                v-model="form.name"
                placeholder="Digite o nome do projeto"
                class="col-span-3"
                required
              />
            </div>
          </div>
          <SheetFooter>
            <Button type="submit" :disabled="isProcessing">
              <LucideSpinner
                v-if="isProcessing"
                class="mr-2 h-4 w-4 animate-spin"
              />
              {{
                isProcessing
                  ? "Carregando..."
                  : isEditing
                  ? "Salvar"
                  : "Criar Projeto"
              }}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal } from "lucide-vue-next";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import api from "@/services/api";

const { toast } = useToast();
const processingAction = ref(null);
const projects = ref([]);
const isLoading = ref(true);
const isProcessing = ref(false);
const processingStatusId = ref(null);
const showModal = ref(false);
const isEditing = ref(false);
const form = ref({
  id: null,
  name: "",
});

const getStatus = (project) => {
  return project.statuses?.[0]?.name || "inactive";
};

const fetchProjects = async () => {
  try {
    const response = await api.get("/projects");
    projects.value = response.data.data;
  } catch {
    toast({
      title: "Erro",
      description: "Erro ao carregar os projetos.",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};

const toggleStatus = async (project) => {
  isProcessing.value = true;
  processingAction.value = `status-${project.id}`;
  processingStatusId.value = project.id;
  try {
    const response = await api.patch(`/projects/${project.id}/toggle`);
    if (response.status === 200) {
      const currentStatus = getStatus(project);
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      project.statuses[0].name = newStatus;
      toast({
        title: "Sucesso",
        description: `Projeto ${
          newStatus === "active" ? "ativado" : "inativado"
        } com sucesso.`,
        variant: "success",
      });
    }
  } catch {
    toast({
      title: "Erro",
      description: "Erro ao alterar o status do projeto.",
      variant: "destructive",
    });
  } finally {
    isProcessing.value = false;
    processingStatusId.value = null;
    processingAction.value = null;
  }
};

const openEditModal = (project) => {
  form.value = { ...project };
  isEditing.value = true;
  showModal.value = true;
};

const openCreateModal = () => {
  form.value = { id: null, name: "" };
  isEditing.value = false;
  showModal.value = true;
};

const createProject = async () => {
  isProcessing.value = true;
  try {
    const response = await api.post("/projects", form.value);
    if (response.status === 201) {
      projects.value.push(response.data.data);
      toast({
        title: "Sucesso",
        description: "Projeto criado com sucesso.",
        variant: "success",
      });
      showModal.value = false;
    }
  } catch {
    toast({
      title: "Erro",
      description: "Erro ao criar o projeto.",
      variant: "destructive",
    });
  } finally {
    isProcessing.value = false;
  }
};

const updateProject = async () => {
  isProcessing.value = true;
  try {
    const response = await api.put(`/projects/${form.value.id}`, form.value);
    if (response.status === 200) {
      const projectIndex = projects.value.findIndex(
        (p) => p.id === form.value.id
      );
      projects.value[projectIndex] = response.data.data;
      toast({
        title: "Sucesso",
        description: "Projeto atualizado com sucesso.",
        variant: "success",
      });
      showModal.value = false;
    }
  } catch {
    toast({
      title: "Erro",
      description: "Erro ao atualizar o projeto.",
      variant: "destructive",
    });
  } finally {
    isProcessing.value = false;
  }
};

onMounted(fetchProjects);
</script>
