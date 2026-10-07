<template>
  <div class="space-y-3 rounded-lg border p-3">
    <div class="flex items-center gap-2">
      <Checkbox
        :id="`roles-different-${uid}`"
        :checked="different"
        @update:checked="toggleDifferent($event === true)"
      />
      <Label :for="`roles-different-${uid}`" class="cursor-pointer font-normal">
        {{ $t("groups_roles_different_per_project") }}
      </Label>
    </div>

    <!-- Mesma role para todos -->
    <div v-if="!different" class="space-y-2">
      <Label>{{ $t("groups_roles_same_for_all") }}</Label>
      <Select :model-value="sameRole" @update:model-value="(value) => onSameRole(String(value))">
        <SelectTrigger><SelectValue :placeholder="$t('groups_roles_select')" /></SelectTrigger>
        <SelectContent>
          <SelectItem v-for="role in roles" :key="role.name" :value="role.name">
            {{ role.title || role.name }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Role por projeto -->
    <div v-else class="space-y-2">
      <div
        v-for="project in projects"
        :key="project.id"
        class="flex items-center justify-between gap-3"
      >
        <span class="truncate text-sm">{{ project.name }}</span>
        <Select
          :model-value="modelValue[String(project.id)] ?? ''"
          @update:model-value="(value) => onProjectRole(project.id, String(value))"
        >
          <SelectTrigger class="w-[180px]">
            <SelectValue :placeholder="$t('groups_roles_none')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{{ $t("groups_roles_none") }}</SelectItem>
            <SelectItem v-for="role in roles" :key="role.name" :value="role.name">
              {{ role.title || role.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Roles from "@/services/roles";

interface ProjectOption {
  id: number;
  name: string;
}

interface RoleOption {
  name: string;
  title?: string | null;
}

const props = defineProps<{
  projects: ProjectOption[];
  modelValue: Record<string, string>;
}>();
const emit = defineEmits<{
  (event: "update:modelValue", value: Record<string, string>): void;
}>();

const uid = Math.random().toString(36).slice(2, 8);
const roles = ref<RoleOption[]>([]);
const different = ref(false);
const sameRole = ref<string>("");

onMounted(load);

async function load() {
  try {
    const response: any = await Roles.index({
      access_type: "client",
      per_page: 100,
    });
    roles.value = response?.data?.roles ?? [];
  } catch {
    roles.value = [];
  }

  const values = Object.values(props.modelValue ?? {});
  if (values.length && values.every((value) => value === values[0])) {
    sameRole.value = values[0];
  }
}

function toggleDifferent(value: boolean) {
  different.value = value;

  if (!value) {
    onSameRole(sameRole.value);
  }
}

function onSameRole(role: string) {
  sameRole.value = role;
  different.value = false;

  const map: Record<string, string> = {};
  if (role) {
    props.projects.forEach((project) => {
      map[String(project.id)] = role;
    });
  }

  emit("update:modelValue", map);
}

function onProjectRole(projectId: number, role: string) {
  const map = { ...(props.modelValue ?? {}) };

  if (role) {
    map[String(projectId)] = role;
  } else {
    delete map[String(projectId)];
  }

  emit("update:modelValue", map);
}
</script>
