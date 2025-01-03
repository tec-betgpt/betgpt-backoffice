<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Gerenciar Usuários</h2>
      <p class="text-muted-foreground">
        Liste, edite, gerencie usuários e altere status.
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
              <TableHead>E-mail</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Acesso</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="user in users" :key="user.id">
              <TableCell>{{ user.id }}</TableCell>
              <TableCell>{{ user.first_name }} {{ user.last_name }}</TableCell>
              <TableCell>{{ user.email }}</TableCell>
              <TableCell>
                <div class="flex items-center">
                  <LucideSpinner
                    v-if="processingStatusId === user.id"
                    class="mr-2 h-4 w-4 animate-spin"
                  />
                  <Badge
                    v-else
                    :variant="
                      getStatus(user) === 'active' ? 'success' : 'destructive'
                    "
                  >
                    {{ getStatus(user) === "active" ? "Ativo" : "Inativo" }}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="success">
                  {{ user.role === "client" ? "Cliente" : "Membro" }}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button size="icon" variant="ghost">
                      <MoreHorizontal class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="openEditModal(user)"
                      >Editar</DropdownMenuItem
                    >
                    <DropdownMenuItem
                      @mousedown="resetPassword(user)"
                      :disabled="processingAction === `reset-${user.id}`"
                    >
                      <div class="flex items-center">
                        <LucideSpinner
                          v-if="processingAction === `reset-${user.id}`"
                          class="mr-2 h-4 w-4 animate-spin"
                        />
                        {{
                          processingAction === `reset-${user.id}`
                            ? "Resetando senha..."
                            : "Resetar Senha"
                        }}
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      @mousedown="toggleStatus(user)"
                      :disabled="processingAction === `status-${user.id}`"
                    >
                      <div class="flex items-center">
                        <LucideSpinner
                          v-if="processingAction === `status-${user.id}`"
                          class="mr-2 h-4 w-4 animate-spin"
                        />
                        {{
                          processingAction === `status-${user.id}`
                            ? getStatus(user) === "active"
                              ? "Desativando..."
                              : "Ativando..."
                            : getStatus(user) === "active"
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
        <Button @click="openCreateModal">Novo Usuário</Button>
      </CardFooter>
    </Card>

    <Sheet v-model:open="showModal">
      <SheetContent position="right" size="lg">
        <SheetHeader>
          <SheetTitle>
            {{ isEditing ? "Editar Usuário" : "Novo Usuário" }}
          </SheetTitle>
          <SheetDescription>
            {{
              isEditing
                ? "Edite as informações do usuário"
                : "Crie um novo usuário"
            }}
          </SheetDescription>
        </SheetHeader>
        <form @submit.prevent="isEditing ? updateUser() : createUser()">
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="first_name">Nome</Label>
              <Input
                id="first_name"
                v-model="form.first_name"
                placeholder="Digite o primeiro nome"
                class="col-span-3"
                required
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="last_name">Sobrenome</Label>
              <Input
                id="last_name"
                v-model="form.last_name"
                placeholder="Digite o sobrenome"
                class="col-span-3"
                required
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="email">Email</Label>
              <Input
                id="email"
                v-model="form.email"
                placeholder="Digite o email"
                class="col-span-3"
                required
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="role">Acesso</Label>
              <Select id="role" v-model="form.role">
                <SelectTrigger class="col-span-3">
                  <SelectValue placeholder="Selecione um perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="member">Membro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid grid-cols-4 gap-4" v-if="form.role === 'client'">
              <Label>Projetos</Label>
              <div class="space-y-2 max-h-72 overflow-y-auto col-span-3">
                <div
                  v-for="project in projects"
                  :key="project.id"
                  class="flex items-center"
                >
                  <Checkbox
                    :checked="form.project_ids.includes(project.id)"
                    @update:checked="onCheckboxChange(project.id, $event)"
                    :id="'project-' + project.id"
                  />
                  <Label
                    class="ml-2 font-normal"
                    :for="'project-' + project.id"
                    >{{ project.name }}</Label
                  >
                </div>
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
                    : "Criar Usuário"
                }}
              </Button>
            </SheetFooter>
          </div>
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal } from "lucide-vue-next";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import api from "@/services/api";

const { toast } = useToast();
const processingAction = ref(null);
const users = ref([]);
const projects = ref([]);
const isLoading = ref(true);
const isProcessing = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const processingStatusId = ref(null);
const form = ref({
  id: null,
  first_name: "",
  last_name: "",
  email: "",
  role: "client",
  project_ids: [],
});

const fetchUsersAndProjects = async () => {
  try {
    const [userResponse, projectResponse] = await Promise.all([
      api.get("/users"),
      api.get("/projects"),
    ]);
    users.value = userResponse.data.data;
    projects.value = projectResponse.data.data;
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao carregar os dados.",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};

const openEditModal = (user) => {
  form.value = {
    ...user,
    role: user.role,
    project_ids: user.project_ids || [],
  };
  isEditing.value = true;
  showModal.value = true;
};

const openCreateModal = () => {
  form.value = {
    id: null,
    first_name: "",
    last_name: "",
    email: "",
    role: "client",
    project_ids: [],
  };
  isEditing.value = false;
  showModal.value = true;
};

const createUser = async () => {
  isProcessing.value = true;
  try {
    const response = await api.post("/users", form.value);
    users.value.push(response.data.data);
    toast({
      title: "Sucesso",
      description: "Usuário criado com sucesso.",
      variant: "success",
    });
    showModal.value = false;
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao criar o usuário.",
      variant: "destructive",
    });
  } finally {
    isProcessing.value = false;
  }
};

const updateUser = async () => {
  isProcessing.value = true;
  try {
    const response = await api.put(`/users/${form.value.id}`, form.value);
    const index = users.value.findIndex((u) => u.id === form.value.id);
    users.value[index] = response.data.data;
    toast({
      title: "Sucesso",
      description: "Usuário atualizado com sucesso.",
      variant: "success",
    });
    showModal.value = false;
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao atualizar o usuário.",
      variant: "destructive",
    });
  } finally {
    isProcessing.value = false;
  }
};

const resetPassword = async (user) => {
  processingAction.value = `reset-${user.id}`;
  try {
    await api.post(`/users/${user.id}/reset-password`);
    toast({
      title: "Senha Resetada",
      description: `Uma nova senha foi enviada para o email de ${user.first_name} ${user.last_name}.`,
      variant: "success",
    });
  } catch (error) {
    toast({
      title: "Erro",
      description: "Não foi possível resetar a senha. Tente novamente.",
      variant: "destructive",
    });
  } finally {
    processingAction.value = null;
  }
};

const toggleStatus = async (user) => {
  processingAction.value = `status-${user.id}`;
  try {
    const response = await api.patch(`/users/${user.id}/toggle`);
    if (response.status === 200) {
      const currentStatus = getStatus(user);
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      user.statuses[0].name = newStatus;
      toast({
        title: "Sucesso",
        description: `Usuário ${
          newStatus === "active" ? "ativado" : "inativado"
        } com sucesso.`,
        variant: "success",
      });
    }
  } catch {
    toast({
      title: "Erro",
      description: "Erro ao alterar o status do usuário.",
      variant: "destructive",
    });
  } finally {
    processingAction.value = null;
  }
};

const getStatus = (user) => {
  return user.statuses?.[0]?.name || "inactive";
};

const onCheckboxChange = (id, checked) => {
  if (checked) {
    form.value.project_ids.push(id);
  } else {
    form.value.project_ids = form.value.project_ids.filter((pid) => pid !== id);
  }
};

onMounted(fetchUsersAndProjects);
</script>
