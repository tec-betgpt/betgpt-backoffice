<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-bold">Gerenciar Projetos</h1>
      <Button @click="openCreateModal" :disabled="isProcessing">
        {{ isProcessing ? "Carregando..." : "Novo Projeto" }}
      </Button>
    </div>

    <!-- Skeleton para Carregamento -->
    <div v-if="isLoading">
      <div class="space-y-4">
        <div v-for="n in 5" :key="n" class="flex items-center justify-between">
          <Skeleton class="h-6 w-1/3" />
          <Skeleton class="h-6 w-1/5" />
          <Skeleton class="h-6 w-1/4" />
        </div>
      </div>
    </div>

    <!-- Tabela -->
    <div v-else>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Nome</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Ações</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="project in projects" :key="project.id">
            <TableCell>{{ project.name }}</TableCell>
            <TableCell>
              <Badge
                :variant="
                  getStatus(project) === 'active' ? 'success' : 'destructive'
                "
              >
                {{ getStatus(project) === "active" ? "Ativo" : "Inativo" }}
              </Badge>
            </TableCell>
            <TableCell>
              <div class="flex space-x-2">
                <Button
                  variant="outline"
                  @click="openEditModal(project)"
                  :disabled="isProcessing"
                >
                  {{ isProcessing ? "Carregando..." : "Editar" }}
                </Button>
                <Button
                  :variant="
                    getStatus(project) === 'active' ? 'destructive' : 'success'
                  "
                  @click="toggleStatus(project)"
                  :disabled="isProcessing"
                >
                  {{
                    isProcessing
                      ? "Carregando..."
                      : getStatus(project) === "active"
                      ? "Inativar"
                      : "Ativar"
                  }}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Modal para criar/editar -->
    <Dialog v-model:open="showModal">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {{ isEditing ? "Editar Projeto" : "Novo Projeto" }}
          </DialogTitle>
        </DialogHeader>
        <form @submit.prevent="isEditing ? updateProject() : createProject()">
          <div class="space-y-4">
            <div>
              <Label for="name">Nome do Projeto</Label>
              <Input
                id="name"
                v-model="form.name"
                placeholder="Digite o nome do projeto"
                required
              />
            </div>
            <Button type="submit" :disabled="isProcessing">
              {{
                isProcessing
                  ? "Carregando..."
                  : isEditing
                  ? "Salvar Alterações"
                  : "Criar Projeto"
              }}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { toast } from "@/components/ui/toast";
import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/services/api";

const projects = ref([]);
const isLoading = ref(true);
const isProcessing = ref(false);
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
    projects.value = response.data;
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
      projects.value.push(response.data);
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
      projects.value[projectIndex] = response.data;
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
