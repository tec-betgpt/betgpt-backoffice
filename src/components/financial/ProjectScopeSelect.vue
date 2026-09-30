<template>
  <Input
    v-if="!isGroupWorkspace"
    :model-value="activeGroupProject?.name"
    disabled
  />
  <Select
    v-else
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', String($event))"
  >
    <SelectTrigger>
      <SelectValue placeholder="Selecione o projeto" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="group">
        <div class="flex items-center gap-2">
          <ProjectAvatar :name="activeGroupProject?.name ?? ''" class="h-4 w-4" />
          Grupo (sem projeto)
        </div>
      </SelectItem>
      <SelectItem
        v-for="project in projectOptions"
        :key="project.id"
        :value="String(project.project_id)"
      >
        <div class="flex items-center gap-2">
          <ProjectAvatar :name="project.name" :logo-url="project.logo" class="h-4 w-4" />
          {{ project.name }}
        </div>
      </SelectItem>
    </SelectContent>
  </Select>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProjectAvatar from "@/components/custom/ProjectAvatar.vue";

defineProps<{
  modelValue: string
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
}>();

const workspaceStore = useWorkspaceStore();
const activeGroupProject = computed(() => workspaceStore.activeGroupProject);
const isGroupWorkspace = computed(() => activeGroupProject.value?.type === "group");

const projectOptions = computed(() =>
  (workspaceStore.group_projects as Array<{
    id: string;
    project_id: string;
    name: string;
    logo: string | null;
    type: string;
  }>).filter((project) => project.type === "project"),
);
</script>
